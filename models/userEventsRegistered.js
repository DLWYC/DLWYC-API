const mongoose = require("mongoose")

const UserRegisteredEventsSchema = new mongoose.Schema({
     userProfile: {
          uniqueID: {
               type: String,
               required: [true, "Please Provide Your Unique ID"]
          },
          fullName: {
               type: String,
               required: [true, "Please Provide Your FullName"]
          },
          email: {
               type: String,
               required: [true, "Please Provide Your Email"]
          }
     },
     event: [{
          eventId: {
               type: String
          },
          eventTitle: {
               type: String
          },
          registrationStatus: {
               type: Boolean
          },
          paymentOption: {
               type: String
          },
          paymentID: {
               type: Number,
               default: null
          },
          paymentStatus: {
               type: String,
               default: 'Not Payed'
          },
          reference: {
               type: String,
               default: null
          },
          modeOfPayment: {
               type: String,
               default: null
          },
          paymentTime: {
               type: String,
          },
     }]
})


const UserRegisteredEventsModel = mongoose.model("User_Event_Registration", UserRegisteredEventsSchema)

module.exports = UserRegisteredEventsModel