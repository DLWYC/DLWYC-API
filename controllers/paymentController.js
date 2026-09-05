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
     const { uniqueId } = req.user;
     const { email, amount, eventId, amountOfPeople, reference } = req.body;

     if (!uniqueId) {
          logger.error("Unauthorized User");
          return res.status(401).json({ error: "Invalid User", type: "Verify incoming user" });
     }

     if (!email || !amount || !reference || !eventId) {
          logger.error(`Invalid Request Parameters`);
          return res.status(400).json({ error: "Invalid Request Parameters", type: "Initialize Transaction" });
     }

     const session = await mongoose.startSession();
     const headCount = parseInt(amountOfPeople, 10);
     let userId = null;

     try {
          await session.withTransaction(async () => {

               // 1. Check If User Exists and Get the User ID
               const userDoc = await UserModel.findOne({ uniqueID: uniqueId }).select('_id').session(session).lean();
               if (!userDoc) {
                    throw { status: 404, error: "USER_NOT_FOUND", type: "PAYMENT INITIALIZATION" };
               }
               userId = userDoc._id;

               // 2. 🟢 CRITICAL CONCURRENCY FIX: Establish a Pessimistic Write-Lock
               // We make an atomic timestamp update on the parent Event document. 
               // This forces any concurrent threads (out of our 20 users) to halt and wait in line, 
               // ensuring the capacity math checks below are perfectly serialised and 100% accurate.
               const lockedEvent = await EventModel.findOneAndUpdate(
                    { _id: eventId },
                    { $set: { updatedAt: new Date() } },
                    { session, new: true }
               ).select('eventCapacity registeredCount');

               if (!lockedEvent) {
                    throw { status: 404, error: "EVENT_NOT_FOUND", type: "PAYMENT INITIALIZATION" };
               }

               // 3. Check if the user has already completely registered/paid for this event initially
               const existingRegistration = await UserEventRegistrationModel.findOne({
                    user: userId,
                    events: { $elemMatch: { eventId: eventId } }
               }).session(session).lean();

               if (existingRegistration) {
                    throw { status: 409, error: "USER_ALREADY_REGISTERED", type: "PAYMENT INITIALIZATION" };
               }

               // 4. Check if there are active available seats left
               const eventReservationAggregation = await EventReservationModel.aggregate([
                    { $match: { eventId: new mongoose.Types.ObjectId(eventId) } },
                    { $unwind: "$users" },
                    { $group: { _id: "$eventId", totalReserved: { $sum: "$users.amountOfPeople" } } } // Fixed aggregation path logic
               ]).session(session);

               const totalReserved = eventReservationAggregation.length > 0 ? eventReservationAggregation[0].totalReserved : 0;
               const absoluteAvailableSeats = lockedEvent.eventCapacity - (lockedEvent.registeredCount + totalReserved);

               console.log("Available seats: ", absoluteAvailableSeats, "Total Reserved: ", totalReserved, "Head Count: ", headCount);

               if (headCount > absoluteAvailableSeats) {
                    logger.error(`Not enough seats available. Requested: ${headCount}, Available: ${absoluteAvailableSeats}`);
                    throw { status: 400, error: "NOT_ENOUGH_SEATS_AVAILABLE", type: "PAYMENT INITIALIZATION" };
               }

               // 5. Check if user already has a pending reservation hold for this event
               const existingUserReservation = await EventReservationModel.findOne({
                    eventId: eventId,
                    "users.userId": userId
               }).session(session).lean();

               if (existingUserReservation) {
                    throw { status: 409, error: "USER_ALREADY_RESERVED", type: "PAYMENT INITIALIZATION" };
               }

               // 6. 🟢 FIXED RESERVATION HOLD INJECTION PATTERN:
               // To avoid complex query array upsert crashes, we query strictly by the eventId.
               // If the master event reservation tracking document doesn't exist, it handles initialization safely.
               await EventReservationModel.findOneAndUpdate(
                    { eventId: eventId },
                    {
                         $push: {
                              users: {
                                   userId: userId,
                                   reference: reference,
                                   amountOfPeople: headCount,
                                   createdAt: new Date() // Useful trace marker
                              }
                         }
                    },
                    { upsert: true, session }
               );

               logger.info(`[Reservation Hold] Successfully locked ${headCount} seats for User ID: ${userId}`);
          });

          // 7. Outside the session transaction layout block, initialize the Paystack gateway pipeline safely
          const initializationResponse = await InitializeTransaction(email, amount, reference, userId, eventId, amountOfPeople);
          logger.info(`Response from Paystack: ${initializationResponse}`);
          return res.status(200).json({ data: initializationResponse });

     } catch (error) {
          logger.error(`Validation Error: ${error.error || error.message}`);

          // Gracefully protect against random unexpected unhandled script rejections
          const returnStatus = error.status && typeof error.status === 'number' ? error.status : 500;
          const returnMessage = error.error || "INTERNAL_SERVER_ERROR";

          return res.status(returnStatus).json({ error: returnMessage, type: error.type || "SYSTEM CRASH BOUNDARY" });
     } finally {
          // Explicit cleanup protocol to release thread connections
          await session.endSession();
     }
};



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
          console.log("Payment status: ", verifyStatus?.data)

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

          const successfulPayment = await ProccessSuccessfulCharge(payStackResponse?.data)

          return res.status(200).json({ success: successfulPayment?.success, status: payStackResponse?.data?.status })

     }
     catch (error) {
          const err = error.response?.data || error.message
          return res.status(500).json({ success: false, error: err })
     }
}





module.exports = { PaystackWebHookController, InitializePaystackTransactionController, VerifyPaymentTransaction }