const logger = require('../config/logger');
const { EventModel } = require('../models/events');
const { EventAttendeeModel } = require("../models/eventsAttendees")
const { UserEventRegistrationModel } = require("../models/userRegisteredEvents")
const { EventCodeGenerator } = require("../utils/codeGenerator")
const { UserModel } = require("../models/users")
const { MembersCodeModel } = require("../models/membersCode")
const mongoose = require('mongoose')


const FreeEventRegistrationController = async (req, res) => {
     const uniqueID = req.user.uniqueId
     const { eventId } = req.body

     if (!uniqueID || !eventId) {
          logger.error(`Missing credential or required parameters`)
          return res.status(400).json({ error: "Invalid Request Parameters", type: "Free Event" })
     }

     const session = await mongoose.startSession();
     session.startTransaction();

     try {

          const user = await UserModel.findOne({ uniqueID }).select('_id').session(session).lean()
          const eventMeta = await EventModel.findById(eventId).select('eventCapacity').session(session).lean()

          console.log("user: ", user._id)

          if (!user) {
               logger.error(`Registration Failed: User with uniqueID ${uniqueID}`)
               await session.abortTransaction();
               return res.status(404).json({ error: "User Profile Not Found", type: "Free Event" })
          }

          if (!eventMeta) {
               logger.error(`Registration Failed: Event ${eventId} not found.`);
               await session.abortTransaction();
               return res.status(404).json({ error: "Event Not Found", type: "Free Event" });
          }

          const hasUserRegistered = await UserEventRegistrationModel.findOne({ user: user._id, 'events.eventId': eventId }).session(session).lean()

          if (hasUserRegistered) {
               logger.error(`Registration Failed: User Has registered for this event`)
               await session.abortTransaction()
               return res.status(409).json({ error: "User has registered for this event before" })
          }

          const totalCapacity = eventMeta?.eventCapacity

          const eventUpdate = await EventModel.findOneAndUpdate({
               _id: eventId,
               registeredCount: { $lt: totalCapacity }
          },
               { $inc: { registeredCount: 1 } },
               { session, returnDocument: 'after' }
          ).lean()

          if (!eventUpdate) {
               await session.abortTransaction()
               return res.status(422).json({ error: "Registration failed. This event is fully booked!" });
          }


          const [userRegistrationCode] = EventCodeGenerator(1);

          // const writeOptions = [
          await UserEventRegistrationModel.findOneAndUpdate(
               { user: user._id },
               {
                    $push: {
                         events: {
                              eventId: eventId,
                              amountOfPeople: 1,
                              paymentOption: "single",
                              registrationCode: userRegistrationCode,
                              registrationStatus: true,
                              modeOfPayment: "code"
                         }
                    }
               },
               { session, upsert: true, returnDocument: 'after' }
          );

          await EventAttendeeModel.findOneAndUpdate(
               { eventId },
               {
                    $push: {
                         attendees: {
                              user: user._id,
                              code: userRegistrationCode
                         }
                    }
               },
               {
                    session,
                    returnDocument: 'after'
               }
          )
          // ]

          // await Promise.all(writeOptions);

          await session.commitTransaction();
          logger.info("sdfsdfdsfdsf")
          return res.status(200).json({
               message: "Event Registration Successful",
          });
     }
     catch (error) {
          await session.abortTransaction();
          if (error.code === 11000) {
               logger.warn(`Concurrency Guard triggered: Prevented duplicate registration for User ${uniqueID}`);
               return res.status(409).json({ error: "You are already registered for this event." });
          }

          logger.error(`Transaction aborted. Error Registering Event: ${error.message}`);
          return res.status(500).json({ message: "An unexpected error occurred while processing your registration." });
     }
     finally {
          await session.endSession();
     }
}


const eventCodeVerificationController = async (req, res) => {
     const uniqueID = req.user.uniqueId
     const { eventId, code } = req.body

     if (!eventId || !code) {
          logger.error(`Missing Credentials or required Parameters :: Code Verification`)
          return res.status(400).json({ error: "Missing Credentials", type: "Code Verification" })
     }
     const session = await mongoose.startSession()
     session.startTransaction()

     try {

          const user = await UserModel.findOne({ uniqueID }).select('_id').session(session).lean();

         
          const [eventExists, alreadyHasTicket] = await Promise.all([
               EventModel.findById(eventId).select('_id').session(session).lean(),
               UserEventRegistrationModel.findOne({
                    user: user._id,
                    events: { $elemMatch: { eventId: eventId } }
               }).session(session).lean()
          ]);

          if (!user) {
               await session.abortTransaction();
               return res.status(404).json({ error: "User profile context not found", type: "Code Verification" });
          }

          if (!eventExists) {
               await session.abortTransaction();
               return res.status(404).json({ error: "The target event could not be found", type: "Code Verification" });
          }

          if (alreadyHasTicket) {
               logger.warn(`Duplication Block: User ${user._id} tried to claim code ${code} but is already registered for Event ${eventId}`);
               await session.abortTransaction();
               return res.status(409).json({ error: "You are already registered/ticketed for this event.", type: "Code Verification" });
          }

          const document = await MembersCodeModel.findOneAndUpdate(
               { eventId: eventId, codes: { $elemMatch: { code: code, status: "Not Used" } } },
               {
                    $set: {
                         'codes.$.user': user._id,
                         'codes.$.status': "Used",
                         'codes.$.usageTime': new Date()
                    }
               },
               { session, returnDocument: 'after' }
          )

          if (!document) {
               logger.error(`Invalid Code: ${code}`)
               await session.abortTransaction()
               return res.status(404).json({ error: "Code is invalid or has already been used", type: "Code Verification" })
          }

          const verificationRecord = {
               eventId: eventId,
               registrationStatus: true,
               paymentOption: "single",
               registrationCode: code,
               amountOfPeople: "1",
               modeOfPayment: "code"
          };

          await Promise.all([
               UserEventRegistrationModel.findOneAndUpdate(
                    { user: user._id },
                    { $push: { events: verificationRecord } },
                    { session, upsert: true, returnDocument: "after" }
               ),
               EventAttendeeModel.findOneAndUpdate(
                    { eventId: eventId },
                    { $push: { attendees: { user: user._id, code: code } } },
                    { session, upsert: true, returnDocument: 'after' }
               )
          ]);

          await session.commitTransaction();
          logger.info(`Code ${code} successfully verified and claimed by User ${user._id} for Event ${eventId}`);

          return res.status(200).json({ message: "Code verification successful! Your ticket is secured.", type: "Code Verification" });


          await session.commitTransaction()
          return res.status(200).json({ message: "Valid Code", type: "Code Verification" })
     }
     catch (error) {
          await session.abortTransaction()
          logger.error(`Error Verifying Code:  ${error}`)
          return res.status(500).json({ error: "Error Verifying Code", type: "Code Verification" })
     }
     finally {
          await session.endSession()
     }
}



module.exports = { FreeEventRegistrationController, eventCodeVerificationController }