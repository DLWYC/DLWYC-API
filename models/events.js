const mongoose = require('mongoose');
const logger = require('../config/logger');

const EventSchema = new mongoose.Schema({
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
     },
     eventPaymentType: {
          type: String,
          required: [true, "Please Provide A Payment Type"],
          enum: ["Paid", "Free"],
     }
})


EventSchema.index({ eventDate: -1});
const EventModel = new mongoose.model("Events", EventSchema)

module.exports = {EventModel};