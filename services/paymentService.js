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
               callback_url: config.paystack.callbackUrl || `${config.client.domain}/dashboard/events`
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
     const headCounts = parseInt(amountOfPeople, 10) + 1
     let membersCodePayLoad;

     const session = await mongoose.startSession();
     session.startTransaction();

     try {
          const isAlreadyProcessed = await UserEventRegistrationModel.findOne(
               { user: userId, events: { $elemMatch: { eventId: eventId, reference: reference } } }
          ).lean()

          if (isAlreadyProcessed) {
               logger.error(`Idempotency Check: This User ${reference} has registered for this event before`)
               await session.abortTransaction()
               return;
          }

          const eventCapacity = await EventModel.findById(eventId).select('eventCapacity').session(session).lean()
          const totalCapacity = eventCapacity?.eventCapacity || 0

          const isEventAvailable = await EventModel.findOneAndUpdate(
               { _id: eventId, registeredCount: { $lte: totalCapacity - headCounts } },
               {
                    $inc: {
                         registeredCount: headCounts
                    }
               },
               { session, returnDocument: "after" }
          ).lean()


          if (!isEventAvailable) {
               logger.error(`Event SoldOut: Event ${eventId} has been sold-out`)
               await session.abortTransaction()

               const failedRecord = await FailedRegistrationModel.create({
                    userId,
                    eventId,
                    reference,
                    amountPaidInKobo: amount,
                    reason: `Events sold out. Required ${headCounts} but totalCapacity ${totalCapacity}`,
                    refundStatus: "Processing"
               })


               const refundResponse = await InitiatePaystackRefund(reference, amount)

               if (refundResponse.success) {
                    await FailedRegistrationModel.findByIdAndUpdate(
                         failedRecord._id,
                         { refundStatus: "Refunded", paystackRefundId: refundResponse.paystackRefundId, refunded: new Date() },
                         { session, returnDocument: 'after' }
                    ).lean()
                    logger.info(`Auto-Refund completed successfully, here's the reference ${reference}`)
               }
               else {
                    await FailedRegistrationModel.findByIdAndUpdate(
                         failedRecord._id,
                         { refundStatus: "Failed" },
                         { session, returnDocument: 'after' }
                    )
                    logger.error(`CRITICAL: Automated refund failed for reference ${reference}. Requires admin manual dashboard intervention.`)
               }

               return;
          }


          const eventRegistrationCode = EventCodeGenerator(headCounts)
          const payersRegistrationCode = eventRegistrationCode[0]

          const eventRecord = {
               eventId: eventId,
               registrationStatus: true,
               paymentOption: headCounts == 1 ? "single" : "multiple",
               registrationCode: payersRegistrationCode,
               amountOfPeople: String(amountOfPeople),
               reference: reference,
               modeOfPayment: channel,
               paymentTime: paid_at
          }

          if (headCounts > 1) {
               const remainingCodes = eventRegistrationCode.slice(1)
               const memberCodes = remainingCodes.map(code => ({
                    code: code,
                    status: "Not Used",
                    user: null,
                    usageTime: null
               }));

               membersCodePayLoad = {
                    payerId: userId,
                    eventId: eventId,
                    codes: memberCodes
               }
          }


          const writeOptions = [
               UserEventRegistrationModel.findOneAndUpdate(
                    { user: userId },
                    { $push: { events: eventRecord } },
                    { session, upsert: true, returnDocument: 'after' }
               ),
               EventAttendeeModel.findOneAndUpdate(
                    { eventId: eventId },
                    { $push: { attendees: { user: userId, code: payersRegistrationCode } } },
                    { session, upsert: true, returnDocument: 'after' }
               )
          ]

          if (membersCodePayLoad) {
               writeOptions.push(

                    MembersCodeModel.findOneAndUpdate(
                         { payerId: userId, eventId: eventId },
                         { $setOnInsert: membersCodePayLoad },
                         { session, upsert: true, returnDocument: 'after' }
                    )
               )
          }


          await Promise.all(writeOptions);
          await session.commitTransaction();
     }

     catch (err) {
          await session.abortTransaction()
          logger.error(`Processing Successful Charged Failed: ${err}`)
          throw err
     }
     finally {
          session.endSession()
     }


}




module.exports = { InitializeTransaction, ProccessSuccessfulCharge, InitiatePaystackRefund }