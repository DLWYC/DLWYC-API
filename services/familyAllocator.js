const Family = require('../models/family');
const {
  MAX_FAMILY_SIZE,
  MAX_PER_ARCHDEACONRY,
  ALLOW_SOFT_ARCHDEACONRY_RELAXATION,
  MAX_ALLOCATION_ATTEMPTS,
} = require('../config/familyAllocation');

class AllocationError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'AllocationError';
    this.code = code; // 'CAMP_FULL' | 'ARCHDEACONRY_OVERFLOW'
  }
}

/**
 * Reads the current archdeaconry count off a lean Family doc, treating
 * "field not present" as 0. Family docs are fetched with .lean() so
 * archdeaconryCounts comes back as a plain object, not a Mongo Map.
 */
function archCount(family, archdeaconry) {
  return (family.archdeaconryCounts && family.archdeaconryCounts[archdeaconry]) || 0;
}

/**
 * Rank candidate families for a given (archdeaconry, ageBand) pair.
 * Priority order:
 *   1. Fewest current members of this ageBand  -> drives Rule 2:
 *      every family should end up with representation across all bands,
 *      and this always routes a new person to whichever family is
 *      currently weakest in their band.
 *   2. Fewest current members of this archdeaconry -> keeps us as far
 *      under the Rule 1 ceiling as possible, not just technically under it.
 *   3. Fewest total members -> keeps the 12 families roughly the same size.
 */
function rankCandidates(families, archdeaconry, ageBand) {
  return [...families].sort((a, b) => {
    const byAgeBand = (a.ageBandCounts[ageBand] || 0) - (b.ageBandCounts[ageBand] || 0);
    if (byAgeBand !== 0) return byAgeBand;

    const byArch = archCount(a, archdeaconry) - archCount(b, archdeaconry);
    if (byArch !== 0) return byArch;

    return a.memberCount - b.memberCount;
  });
}

/**
 * Attempts to atomically claim one slot in `familyId` for this
 * (archdeaconry, ageBand). Re-checks BOTH constraints in the query filter
 * itself so this is safe under concurrent registrations — if two requests
 * race for the last archdeaconry slot in a family, only one findOneAndUpdate
 * will match and increment; the other gets null back and the caller retries
 * against the next-ranked candidate.
 */
async function tryClaimSlot(familyId, archdeaconry, ageBand, { allowArchOverflow = false } = {}) {
  const archField = `archdeaconryCounts.${archdeaconry}`;

  const filter = {
    _id: familyId,
    memberCount: { $lt: MAX_FAMILY_SIZE },
  };

  if (!allowArchOverflow) {
    filter.$or = [
      { [archField]: { $exists: false } },
      { [archField]: { $lt: MAX_PER_ARCHDEACONRY } },
    ];
  }

  const update = {
    $inc: {
      memberCount: 1,
      [archField]: 1,
      [`ageBandCounts.${ageBand}`]: 1,
    },
  };

  return Family.findOneAndUpdate(filter, update, { new: true });
}

/**
 * Public entry point. Call this from the registration controller AFTER
 * you know the user's archdeaconry and ageBand, but ideally inside the
 * same transaction you use to persist the User document (see
 * registration.controller.js for the transactional wiring).
 *
 * Returns the updated Family document the user was placed into.
 */
async function allocateFamily({ userId, archdeaconry, ageBand }) {
  if (!archdeaconry) throw new AllocationError('archdeaconry is required', 'BAD_INPUT');
  if (!ageBand) throw new AllocationError('ageBand is required', 'BAD_INPUT');

  for (let attempt = 0; attempt < MAX_ALLOCATION_ATTEMPTS; attempt += 1) {
    // Re-read fresh state every attempt — cheap, since it's 12 docs.
    const families = await Family.find({}).lean();

    const eligible = families.filter(
      (f) => f.memberCount < MAX_FAMILY_SIZE && archCount(f, archdeaconry) < MAX_PER_ARCHDEACONRY
    );

    if (eligible.length > 0) {
      const ranked = rankCandidates(eligible, archdeaconry, ageBand);
      for (const candidate of ranked) {
        const claimed = await tryClaimSlot(candidate._id, archdeaconry, ageBand);
        if (claimed) return claimed;
        // Someone else took the slot between our read and our write —
        // fall through to the next-ranked candidate in this same attempt.
      }
      // All ranked candidates lost their race this round; loop and re-read.
      continue;
    }

    // No family satisfies BOTH constraints. Figure out why.
    const withSpace = families.filter((f) => f.memberCount < MAX_FAMILY_SIZE);

    if (withSpace.length === 0) {
      throw new AllocationError('All families are at full capacity (720/720).', 'CAMP_FULL');
    }

    // There IS room overall, but every family with room is already at the
    // Rule 1 ceiling for this archdeaconry. This means this archdeaconry
    // has registered more than MAX_PER_ARCHDEACONRY * 12 people (120 by
    // default) — a genuine overflow scenario, not a bug.
    if (!ALLOW_SOFT_ARCHDEACONRY_RELAXATION) {
      throw new AllocationError(
        `Archdeaconry "${archdeaconry}" has reached the cap in every family with remaining space.`,
        'ARCHDEACONRY_OVERFLOW'
      );
    }

    // Soft relaxation: place into whichever eligible-by-capacity family
    // currently has the LOWEST archdeaconry count (minimizes the breach),
    // and record it for admin review.
    const ranked = rankCandidates(withSpace, archdeaconry, ageBand);
    for (const candidate of ranked) {
      const claimed = await tryClaimSlot(candidate._id, archdeaconry, ageBand, {
        allowArchOverflow: true,
      });
      if (claimed) {
        await Family.updateOne(
          { _id: claimed._id },
          {
            $push: {
              ruleRelaxations: {
                userId,
                archdeaconry,
                reason: `Rule 1 soft-relaxed: archdeaconry cap (${MAX_PER_ARCHDEACONRY}) reached in every family with space.`,
              },
            },
          }
        );
        return claimed;
      }
    }
    // lost every race, loop and retry
  }

  throw new AllocationError(
    'Could not allocate a family after multiple attempts due to concurrent registrations. Please retry.',
    'CONTENTION_EXHAUSTED'
  );
}

module.exports = { allocateFamily, AllocationError };