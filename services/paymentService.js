const config = require('../config/index')
const logger = require('../config/logger')
const axios = require("axios")
const mongoose = require('mongoose')
const { UserEventRegistrationModel } = require('../models/userRegisteredEvents')
const { EventCodeGenerator } = require('../utils/codeGenerator')
const { EventAttendeeModel } = require('../models/eventsAttendees')
const { EventModel } = require('../models/events');
const { FailedRegistrationModel } = require('../models/failedRegistration')
const { MembersCodeModel } = require('../models/membersCode')

const InitializeTransaction = async (email, amount, reference, userId, eventId, amountOfPeople) => {
     console.log(email, amount, reference, userId, eventId, amountOfPeople)
     try {

          const transactionPayload = {
               email: email,
               amount: Number(amount) * 100,
               reference: reference,
               metadata: {
                    userId: userId,
                    eventId: eventId,
                    amountOfPeople: amountOfPeople
               },
               callback_url: config.paystack.callbackUrl || `${config.client.domain}/dashboard/events/${eventId}`
          }

          const response = await axios.post(
               'https://api.paystack.co/transaction/initialize',
               transactionPayload,
               {
                    headers: {
                         Authorization: `Bearer ${config.paystack.secret_key}`,
                         'Content-Type': "application/json"
                    }
               }
          )

          logger.info(`Paystack Initalized Successfully`);
          return await response.data

     }
     catch (err) {
          logger.error(`Paystack Initialization Failed ${err}`)
          throw err
     }
}

const InitiatePaystackRefund = async (reference, amountInKobo) => {
     try {
          const response = await axios.post(`https://api.paystack.co/refund`, { transaction: reference, amount: amountInKobo }, {
               headers: {
                    'Authorization': `Bearer ${config.paystack.secret_key}`,
                    'Content-Type': 'application/json'
               }
          })

          const payStackResponse = response.data
          if (!payStackResponse.status) {
               logger.error(`Error: Refunding request Failed `)
               throw new Error(payStackResponse.message || 'Paystack Communication Failed')
          }

          logger.info(`Paystack Refund Request Initiated Successfully`);
          return {
               success: true,
               paystackRefundId: payStackResponse.data.id,
               refundStatus: payStackResponse.data.status
          }

     }
     catch (error) {
          const errMessage = error.response?.data?.message || error.message
          logger.error(`Paystack Refund Service Error for reference ${reference}: ${errMessage}`)
          return { success: false, error: errMessage }
     }
}


const ProccessSuccessfulCharge = async (payload) => {
     const { reference, metadata, channel, paid_at, amount } = payload;
     const { userId, eventId, amountOfPeople } = metadata;
     const headCounts = parseInt(amountOfPeople, 10);
     let membersCodePayLoad;

     const session = await mongoose.startSession();

     try {
          // Wrap EVERYTHING in a managed transaction block
          const EventRegistrationLogic = await session.withTransaction(async () => {

               // Check If User has registered aleady
               const existingRegistration = await UserEventRegistrationModel.findOne(
                    { user: userId, events: { $elemMatch: { eventId: eventId } } }
               ).session(session).lean();

               if (existingRegistration) {
                    logger.info(`User ${userId} has already registered for Event ${eventId}. Skipping registration.`);
                    return { success: true, reason: 'ALREADY_REGISTERED' };
               }

               // 1. STAGE 1 IDEMPOTENCY: Check if reference already exists globally
               // const hasUserPaidForEvent = await UserEventRegistrationModel.findOne(
               //      { user: userId, events: { $elemMatch: { eventId: eventId, reference: reference } } }
               // ).session(session).lean();

               // if (hasUserPaidForEvent) {
               //      logger.info(`Idempotency Safeguard: User with reference ${reference} has already registered.`);
               //      return { success: true, reason: 'ALREADY_PROCESSED' };
               // }

               // 2. CAPACITY VALIDATION: Fetch total capacity within the active session snapshot
               // const eventData = await EventModel.findById(eventId).select('eventCapacity').session(session).lean();
               // const totalCapacity = eventData?.eventCapacity || 0;

               // Atomic update checking room dynamically
               // const isEventAvailable = await EventModel.findOneAndUpdate(
               //      { _id: eventId, registeredCount: { $lte: totalCapacity - headCounts } },
               //      { $inc: { registeredCount: headCounts } },
               //      { session, new: true }
               // ).lean();

               // // 3. OVERCAPACITY MANAGEMENT: Auto-refund pipeline
               // if (!isEventAvailable) {
               //      logger.error(`Event SoldOut: Allocation failed for Event ${eventId}. Initiating reversal.`);

               //      // Persist audit trail INSIDE the session so it commits even on failure states
               //      const failedRecord = await FailedRegistrationModel.create(
               //           [{
               //                userId,
               //                eventId,
               //                reference,
               //                amountPaidInKobo: amount,
               //                reason: `Sold out. Requested ${headCounts}, remaining capacity exhausted.`,
               //                refundStatus: "Processing"
               //           }],
               //           { session }
               //      );

               //      const refundResponse = await InitiatePaystackRefund(reference, amount);

               //      await FailedRegistrationModel.findByIdAndUpdate(
               //           failedRecord[0]._id,
               //           {
               //                refundStatus: refundResponse.success ? "Refunded" : "Failed",
               //                paystackRefundId: refundResponse.paystackRefundId || null,
               //                refunded: refundResponse.success ? new Date() : null
               //           },
               //           { session }
               //      );

               //      return { success: false, reason: 'EVENT_SOLD_OUT' };
               // }

               // 4. BUSINESS ARTIFACT GENERATION
               const eventRegistrationCode = EventCodeGenerator(headCounts);
               const payersRegistrationCode = eventRegistrationCode[0];

               const eventRecord = {
                    eventId: eventId,
                    registrationStatus: true,
                    paymentOption: headCounts === 1 ? "single" : "multiple",
                    registrationCode: payersRegistrationCode,
                    amountOfPeople: String(amountOfPeople),
                    reference: reference,
                    modeOfPayment: channel,
                    paymentTime: paid_at
               };

               if (headCounts > 1) {
                    const remainingCodes = eventRegistrationCode.slice(1);
                    membersCodePayLoad = {
                         payerId: userId,
                         eventId: eventId,
                         codes: remainingCodes.map(code => ({
                              code,
                              status: "Not Used",
                              user: null,
                              usageTime: null
                         }))
                    };
               }

               // 5. ATOMIC WRITES COORDINATION
               const writeOptions = [
                    UserEventRegistrationModel.findOneAndUpdate(
                         { user: userId },
                         { $push: { events: eventRecord } },
                         { session, upsert: true, new: true }
                    ),
                    EventAttendeeModel.findOneAndUpdate(
                         { eventId: eventId },
                         { $push: { attendees: { user: userId, code: payersRegistrationCode } } },
                         { session, upsert: true, new: true }
                    ),
                    EventModel.findByIdAndUpdate(eventId, { $inc: { registeredCount: headCounts } }, { session, new: true })
               ];

               if (membersCodePayLoad) {
                    writeOptions.push(
                         MembersCodeModel.findOneAndUpdate(
                              { payerId: userId, eventId: eventId },
                              { $setOnInsert: membersCodePayLoad },
                              { session, upsert: true, new: true }
                         )
                    );
               }

               await Promise.all(writeOptions);
               return { success: true, reason: 'REGISTRATION_SUCCESSFUL' };
          });
     } catch (err) {
          logger.error(`Critical Registration Pipeline Failure: ${err.message}`);
          throw err;
     } finally {
          await session.endSession();
     }


}


const ProcessFailedCharge = async (payStackResponse) => {
     const { reference, metadata, amount, status, gateway_response } = payStackResponse || {};
     const { userId, eventId } = metadata;

     // 1. Validate incoming Paystack status early (Guard Clause)
     if (status === "success" || gateway_response === "Successful") {
          return { success: true, reason: 'PAYMENT_SUCCESSFUL' };
     }

     const session = await mongoose.startSession();

     try {
          let result;

          // Use withTransaction for built-in, safe commit/abort handling
          await session.withTransaction(async () => {
               const amountPaid = amount || amount || 0;
               const failureReason = gateway_response || 'Unknown Reason';

               // 2. Create the failed registration record first
               const [failedRecord] = await FailedRegistrationModel.create(
                    [{
                         userId,
                         eventId,
                         reference,
                         amountPaidInKobo: amountPaid,
                         reason: `Payment Failed: ${failureReason}`,
                         refundStatus: "Processing"
                    }],
                    { session }
               );

               // 3. Initiate the refund sequentially
               const refundResponse = await InitiatePaystackRefund(reference, amountPaid);

               // 4. Update the record with the refund outcome
               await FailedRegistrationModel.findByIdAndUpdate(
                    failedRecord._id,
                    {
                         refundStatus: refundResponse?.success ? "Refunded" : "Failed",
                         paystackRefundId: refundResponse?.paystackRefundId || null,
                         refunded: refundResponse?.success ? new Date() : null
                    },
                    { session, new: true }
               );

               result = { success: false, reason: 'PAYMENT_FAILED' };
          });

          return result;

     } catch (error) {
          logger.error("Error Processing Failed Charge: ", error);
          return { success: false, reason: 'INTERNAL_SERVER_ERROR', error: error.message };
     } finally {
          // Always clean up and close the session
          await session.endSession();
     }
};





module.exports = { InitializeTransaction, ProccessSuccessfulCharge, ProcessFailedCharge, InitiatePaystackRefund }