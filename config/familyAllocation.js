module.exports = {
     MAX_FAMILY_SIZE: 60,
     MAX_PER_ARCHDEACONRY: 10,
     ALLOW_SOFT_ARCHDEACONRY_RELAXATION: true,

     AGE_BANDS: ['teens', 'university_age', 'young_professional', 'thirty_plus'],

     AGE_BAND_RANGES: {
          teens: { min: 13, max: 19 },
          university_age: { min: 20, max: 24 },
          young_professional: { min: 25, max: 29 },
          thirty_plus: { min: 30, max: 200 },
     },

     FAMILY_NAMES: [
          'Restore', 'Refocus', 'Renew', 'Reconcile', 'Rebuilders', 'Recommit',
          'Revive', 'Rekindle', 'Reborn', 'Rise Up', 'Revivers', 'Rising Stars',
     ],

     // Bounded retry loop for optimistic-concurrency contention on the
     // findOneAndUpdate step (see familyAllocator.service.js)
     MAX_ALLOCATION_ATTEMPTS: 6,
};