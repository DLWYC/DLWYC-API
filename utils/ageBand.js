const { AGE_BAND_RANGES } = require('../config/familyAllocation');

/**
 * Computes age in whole years from a date of birth.
 */
// function computeAge(dateOfBirth) {
//   const dob = new Date(dateOfBirth);
//   if (Number.isNaN(dob.getTime())) {
//     throw new Error('Invalid dateOfBirth supplied');
//   }
//   const today = new Date();
//   let age = today.getFullYear() - dob.getFullYear();
//   const monthDiff = today.getMonth() - dob.getMonth();
//   if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
//     age -= 1;
//   }
//   return age;
// }

/**
 * Maps a numeric age to one of the configured age bands.
 * Throws if the age falls outside every configured band (e.g. under 13),
 * so callers can decide policy (reject registration, flag for review, etc.)
 * rather than silently mis-bucketing someone.
 */
function ageToBand(age) {
  for (const [band, range] of Object.entries(AGE_BAND_RANGES)) {
    if (age >= range.min && age <= range.max) return band;
  }
  return null;
}

function computeAgeBand(dateOfBirth) {
//   const age = computeAge(dateOfBirth);
  const band = ageToBand(age);
  if (!band) {
    throw new Error(`No configured age band covers age ${age}. Check AGE_BAND_RANGES.`);
  }
  return band;
}

module.exports = {  ageToBand, computeAgeBand };