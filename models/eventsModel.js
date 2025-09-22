const mongoose = require('mongoose')
const eventSchema = new mongoose.Schema({
     eventTitle: {
          type: String,
          required: [true, "Please Provide A Title For This Event"]
     },
     eventDate: {
          type: Date,
          required: [true, "Please Provide A Date For The Event"]
     },
     eventLocation: {
          type: String,
          required: [true, "Please Provide A Location For The Event"]
     },
     eventTime: {
          type: String,
          required: [true, "Please Provide A Time For The Event"]
     },
     eventDescription: {
          type: String,
          required: [true, "Please Provide A Description For The Event"]
     }
})



const eventModel = new mongoose.model("Events", eventSchema)

module.exports = eventModel