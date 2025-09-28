const mongoose = require('mongoose')
const paymentCodeSchema = new mongoose.Schema({
     payerId: {
          type: String,
          required: [true, "Please Provide A Title For This Event"]
     },
     payerArchdeaconry: {
          type: String,
     },
     codes: [{
          code: {
               type: String
          },
          status: {
               type: String,
               enum: ["Used", "Not Used"]
          },
          userName: {
               type: String
          },
          userEmail: {
               type: String
          },
          userId: {
               type: Number,
               default: null
          },
     }]
})



const paymentCodeModel = new mongoose.model("PaymentCode", paymentCodeSchema)

module.exports = { paymentCodeModel }