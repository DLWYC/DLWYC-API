const mongoose = require("mongoose")
const MembersCodeSchema = new mongoose.Schema({
   payerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      require: true
   },
   eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "events",
      require: true
   },
   codes: [{
      code: {
         type: String
      },
      status: {
         type: String,
         enum: ["Used", "Not Used"]
      },
      user: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "user",
      },
      usageTime: {
         type: Date
      }
   }]
})

MembersCodeSchema.index({ payerId: 1, eventId: 1 }, { unique: true })
MembersCodeSchema.index({ eventId: 1, 'codes.code': 1, 'codes.status': 1 })

const MembersCodeModel = new mongoose.model("members_code", MembersCodeSchema);
module.exports = { MembersCodeModel }