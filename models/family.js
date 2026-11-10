const mongoose = require('mongoose');
const { Schema } = mongoose;


const familySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: Number, required: true, unique: true, min: 1, max: 12 },

    memberCount: { type: Number, default: 0, min: 0 },

    archdeaconryCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    ageBandCounts: {
      teens: { type: Number, default: 0 },
      university_age: { type: Number, default: 0 },
      young_professional: { type: Number, default: 0 },
      thirty_plus: { type: Number, default: 0 },
    },

    ruleRelaxations: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        archdeaconry: String,
        reason: String,
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Family', familySchema);