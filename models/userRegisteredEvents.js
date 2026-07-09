const mongoose = require("mongoose")
const UserEventRegistrationSchema = new mongoose.Schema({
     user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "user",
          require: true
     },
     events: [{
          eventId: {
               type: mongoose.Schema.Types.ObjectId,
               ref: "Events",
               require: true
          },
          registrationStatus: {
               type: Boolean,
               default: false
          },
          paymentOption: {
               type: String
          },
          registrationCode: {
               type: String
          },
          amountOfPeople: {
               type: String
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
               type: String
          },
          checkedInStatus: {
               type: Boolean,
               default: false
          },
          checkedInTime: {
               type: Date
          },
          registerTime: {
               type: Date,
               default: Date.now()
          }
     }]
})

UserEventRegistrationSchema.index({ uniqueId: 1 })

const UserEventRegistrationModel = mongoose.model("user_event_registration", UserEventRegistrationSchema);

module.exports = { UserEventRegistrationModel }