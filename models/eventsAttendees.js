const mongoose = require('mongoose')
const EventAttendeesSchema = new mongoose.Schema({
     eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Events",
          require: true
     },
     attendees: [
          {
               user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "user",
                    require: true
               },
               code: {
                    type: String,
                    require: true
               }
          }
     ]
})

EventAttendeesSchema.index({ eventId: 1, 'attendees.user': 1 }, { unique: true })

const EventAttendeeModel = new mongoose.model("event_attendees", EventAttendeesSchema);
module.exports = { EventAttendeeModel }