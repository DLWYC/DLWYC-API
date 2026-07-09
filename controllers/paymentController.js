const logger = require('../config/logger');
const { InitializeTransaction } = require('../services/paymentService')
const { VerifyPaystackSignature } = require('../utils/crypto')
const { ProccessSuccessfulCharge } = require('../services/paymentService');
const { UserEventRegistrationModel } = require('../models/userRegisteredEvents');
const { UserModel } = require('../models/users')
const mongoose = require('mongoose')

const PaystackWebHookController = async (req, res) => {
     try {
          const isHashValid = VerifyPaystackSignature(req)
          if (!isHashValid) {
               logger.error(`Security alert: Unauthorized Paystack webhook signature detected`)
               return res.status(401).json({ error: "Invalid Cryptographic Signature" })
          }

          res.status(200).json({ status: "acknowledege" })


          const { event, data } = req.body
          if (event == "charge.success") {
               await ProccessSuccessfulCharge(data)
          }

     }
     catch (error) {
          logger.error(`Webhook error: ${error.message}`)
          if (!res.headersSent) {
               return res.status(500).json({ error: "Internal server error" });
          }
     }


}


const InitializePaystackTransactionController = async (req, res) => {
     const { uniqueId } = req.user
     const { email, amount, reference, eventId, amountOfPeople } = req.body;

     if (!uniqueId) {
          logger.error("Unauthrized User")
          return res.status(401).json({ error: "Invalid User", type: "Verify incoming user" })
     }

     if (!email || !amount || !reference  || !eventId) {
          logger.error(`Invalid Request Parameters`);
          return res.status(400).json({ error: "Invalid Request Parmeters", type: "Initialize Transaction" })
     }

     const session = await mongoose.startSession();
     session.startTransaction()
     try {
          const userId = await UserModel.findOne({ uniqueID: uniqueId }).select('_id').session(session).lean()

          const user = await UserEventRegistrationModel.findOne({ user: userId, events: { $elemMatch: { eventId: eventId } } }).session(session).lean()

          if (user) {
               logger.error('User Has Registered for event Before')
               await session.abortTransaction()
               return res.status(409).json({ error: "Initialization Failed: User has registerd before" })
          }



          const amountToBePayed = amount * (amountOfPeople + 1)
          console.log("amount of peropls", amountToBePayed, amountOfPeople)
          const initializationResponse = await InitializeTransaction(email, amountToBePayed, reference, userId, eventId, amountOfPeople)

          logger.info(`Reponse from Paystack: ${initializationResponse}`)
          res.status(200).json({ data: initializationResponse })
     }
     catch (error) {
          logger.error(`Initialization Error: ${error}`)
          res.status(500).json({ error: "Initialization Failed", type: "Paystack Error" })
     }


}



module.exports = { PaystackWebHookController, InitializePaystackTransactionController }