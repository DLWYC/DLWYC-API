const logger = require('../config/logger');
const { InitializeTransaction, ProcessFailedCharge } = require('../services/paymentService')
const { VerifyPaystackSignature } = require('../utils/crypto')
const { ProccessSuccessfulCharge } = require('../services/paymentService');
const { UserEventRegistrationModel } = require('../models/userRegisteredEvents');
const { UserModel } = require('../models/users')
const { EventModel } = require('../models/events')
const { EventReservationModel } = require('../models/eventReservation')
const mongoose = require('mongoose')
const axios = require("axios")
const config = require('../config/index')


const PaystackWebHookController = async (req, res) => {
     try {
          const isHashValid = VerifyPaystackSignature(req)
          if (!isHashValid) {
               logger.error(`Security alert: Unauthorized Paystack webhook signature detected`)
               return res.status(401).json({ error: "Invalid Cryptographic Signature" })
          }

          console.log(isHashValid, "is hash valid")
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
     const { email, amount, eventId, amountOfPeople } = req.body;

     // const reference = 

     if (!uniqueId) {
          logger.error("Unauthrized User")
          return res.status(401).json({ error: "Invalid User", type: "Verify incoming user" })
     }

     if (!email || !amount || !reference || !eventId) {
          logger.error(`Invalid Request Parameters`);
          return res.status(400).json({ error: "Invalid Request Parmeters", type: "Initialize Transaction" })
     }

     const session = await mongoose.startSession();
     const headCount = parseInt(amountOfPeople, 10);
     let userId = null;

     try {
          // Run the transaction and get a result structure back
          const transactionResult = await session.withTransaction(async () => {

               // 1. Check If User Exist and Get the User ID
               const userDoc = await UserModel.findOne({ uniqueID: uniqueId }).select('_id').session(session).lean();
               if (!userDoc) {
                    throw { status: 404, error: "USER_NOT_FOUND" };
               }
               userId = userDoc._id;

               // 2. Check If the evnt is a valid event
               const eventData = await EventModel.findById(eventId).select('eventCapacity registeredCount').session(session).lean();

               if (!eventData) {
                    throw { status: 404, error: "EVENT_NOT_FOUND" };
               }


               // 3. Check to know if the user trying to register has registered initially
               const existingRegistration = await UserEventRegistrationModel.findOne({
                    user: userId,
                    events: { $elemMatch: { eventId: eventId } }
               }).session(session).lean();

               if (existingRegistration) {
                    throw { status: 409, error: "USER_ALREADY_REGISTERED", type: "PAYMENT INITIALIZATION" };
               }



               // 3. Check if there are available seats left
               // ::::::::::::; Get me to total amount of people that have been reserved for this event and compare it with the total capacity of the event
               const eventReservationAggregation = await EventReservationModel.aggregate([
                    { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
                    { $unwind: "$users" },
                    { $group: { _id: "$eventId", totalReserved: { $sum: "$amountOfPeople" } } }
               ]).session(session);

               const totalReserved = eventReservationAggregation.length > 0 ? eventReservationAggregation[0].totalReserved : 0;
               const absoluteAvailableSeats = eventData.eventCapacity - (eventData.registeredCount + totalReserved);
               console.log("AVailable seats: ", absoluteAvailableSeats, "Total Reserved: ", totalReserved, "Head Count: ", headCount)
               if (headCount > absoluteAvailableSeats) {
                    logger.error(`Not enough seats available. Requested: ${headCount}, Available: ${absoluteAvailableSeats}`);
                    throw { status: 400, error: "TICKETS SOLD OUT", type: "PAYMENT INITIALIZATION" };
               }


               // 4. Check if user has reservations for this event initially
               const existingUserReservation = await EventReservationModel.findOne({
                    eventId: eventId,
                    users: { $elemMatch: { userId: userId } }
               }).session(session).lean();

               if (existingUserReservation) {
                    throw { status: 409, error: "USER_ALREADY_RESERVED", type: "PAYMENT INITIALIZATION" };
               }





               // 4. FIX: Use $push instead of $set so you don't erase other users
               await EventReservationModel.findOneAndUpdate(
                    { eventId: eventId, users: { $elemMatch: { userId: userId } } },
                    { $push: { users: { userId: userId, reference: reference, amountOfPeople: headCount } } },
                    { upsert: true, session, new: true }
               );

               console.log("Exisitng Reservation: ", existingUserReservation)



               console.log("Reservation Aggregation: ", eventReservationAggregation)

               // Return data out of the transaction successfully
               return { status: 200, success: true };
          });

          const initializationResponse = await InitializeTransaction(email, amount, reference, userId, eventId, amountOfPeople)
          logger.info(`Reponse from Paystack: ${initializationResponse}`)
          return res.status(200).json({ data: initializationResponse })

     } catch (error) {
          // Catch both validation/business logic errors thrown above and systemic errors
          if (error.status) {
               logger.error(`Validation Error: ${error.error}`);
               return res.status(error.status).json({ error: error.error, type: error.type });
          }

          logger.error(`Initialization System Error: ${error}`);
          return res.status(500).json({ error: "Initialization Failed", type: "Paystack Error" });
     }
     // // ::::::::::::::


}


const VerifyPaymentTransaction = async (req, res) => {
     const { reference } = req.params
     let failedRecord;
     try {
          if (!reference) {
               logger.error("Invalid Request Parameters");
               return res.status(400).json({ error: "Invalid Request Parmeters", type: "Verify Transaction" })
          }

          const verifyStatus = await axios.get(`https://api.paystack.co/transaction/verify/${reference}`,
               {
                    headers: {
                         'Authorization': `Bearer ${config.paystack.secret_key}`,
                         'Content-Type': 'application/json'
                    }
               }
          )

          const payStackResponse = verifyStatus?.data
          if (!payStackResponse.status) {
               logger.error(`Error: Verifying request Failed `)
               throw new Error(payStackResponse.message || 'Paystack Communication Failed')
          }

          
          // If the payment was not successful, initiate a refund and log the failed registration
          if (payStackResponse?.data?.status !== "success" && payStackResponse?.data?.gateway_response !== "Successful") {
              const failedPayment = await ProcessFailedCharge(payStackResponse?.data);
               return res.status(400).json({ success: false, status: payStackResponse?.data?.status, failedPayment });

          }    

          const successfulPayment = await ProccessSuccessfulCharge(payStackResponse?.data?.status)

          return res.status(200).json({ success: successfulPayment?.success, status: payStackResponse?.data })

     }
     catch (error) {
          const err = error.response?.data || error.message
          return res.status(500).json({ success: false, error: err })
     }
}





module.exports = { PaystackWebHookController, InitializePaystackTransactionController, VerifyPaymentTransaction }