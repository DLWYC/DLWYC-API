const express = require('express')
const router = express.Router()
const UserRegisteredEventsModel = require('../../models/userEventsRegistered')
const { userModel } = require('../../models/userModels')
const { errorHandling } = require('../../controllers/errorHandler')
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);



router.get('/:fullName/:uniqueID(.*)', async (req, res) => {
     const { fullName, uniqueID } = req.params

     try {
          const userRegisteredEvent = await UserRegisteredEventsModel.find({ $and: [{ "userProfile.fullName": fullName }, { "userProfile.uniqueID": uniqueID }] })


          if (userRegisteredEvent.length <= 0) {
               res.status(200).json({ message: "You've Not Registered For Any Event", data: userRegisteredEvent })
          }
          else {
               res.status(200).json({ message: "Events Found", data: userRegisteredEvent[0].event })
          }
     }
     catch (error) {
          const err = errorHandling(error);
          console.error(err);
          res.status(400).json({ errors: err, message: "User Event Registration Error" });
     }

})



router.post('/', async (req, res) => {
     const { uniqueID, fullName, email, eventId, eventTitle, registrationStatus, paymentOption, reference, paymentStatus, modeOfPayment, paymentTime, paymentID, amountOfPeople } = req.body

     console.log("######################################", uniqueID, fullName, email, eventId, eventTitle, registrationStatus, paymentOption, reference, paymentStatus, modeOfPayment, paymentTime, paymentID, amountOfPeople, "######################################")

     try {
          // Check if user exists
          const ifUserExists = await userModel.findOne({ $and: [{ "uniqueID": uniqueID }, { "email": email }] })

          if (!ifUserExists) {
               return res.status(400).json({
                    message: `Sorry This User ${fullName} Does Not Have Any Account`,
                    location: "User Registration EndPoint"
               });
          }

          // Find existing user registered events
          const userRegisteredEvent = await UserRegisteredEventsModel.findOne({
               $and: [
                    { "userProfile.uniqueID": uniqueID },
                    { "userProfile.email": email }
               ]
          })

          // **CRITICAL FIX: Check for duplicate payment reference**
          if (userRegisteredEvent && reference) {
               const duplicatePayment = userRegisteredEvent.event.find(
                    evt => evt.reference === reference && evt.paymentID === paymentID
               );

               if (duplicatePayment) {
                    console.log('Duplicate payment detected, returning existing registration');
                    return res.status(200).json({
                         message: 'Registration already exists for this payment',
                         data: duplicatePayment,
                         isDuplicate: true
                    });
               }
          }

          const event = {
               "eventId": eventId,
               "eventTitle": eventTitle,
               "amountOfPeople": amountOfPeople,
               "registrationStatus": modeOfPayment == 'Code' ? true : paymentStatus == 'success' ? true : false,
               "paymentStatus": modeOfPayment == 'Code' ? 'success' : paymentStatus,
               "reference": reference,
               "modeOfPayment": modeOfPayment,
               "paymentTime": modeOfPayment == 'Code' ? new Date() : paymentTime,
               "paymentOption": paymentOption,
               "paymentID": paymentID,
          }

          if (userRegisteredEvent) {
               const userevents = userRegisteredEvent.event || []

               // Check if already registered for the same event
               if (userevents.some(events => events.eventId === event?.eventId)) {
                    throw new Error("Cannot Register For The Same Event Twice");
               }

               // Add new event
               userevents.push(event)
               await userRegisteredEvent.save()

               switch (paymentStatus) {
                    case 'failed':
                         return res.status(200).json({ message: `Registration Failed` })
                    case 'abandoned':
                         return res.status(200).json({ message: `Registration Abandoned` })
                    default:
                         return res.status(200).json({ message: `Registration Successful`, data: event })
               }
          } else {
               // Create new registration document
               const eventDetails = new UserRegisteredEventsModel({
                    userProfile: {
                         "uniqueID": uniqueID,
                         "fullName": fullName,
                         "email": email
                    },
                    event: [event]
               })

               const savedEvent = await eventDetails.save()

               switch (paymentStatus) {
                    case 'failed':
                         return res.status(200).json({ message: `Registration Failed`, data: savedEvent.event })
                    case 'abandoned':
                         return res.status(200).json({ message: `Registration Abandoned` })
                    default:
                         return res.status(200).json({ message: "Registered Successfully", data: savedEvent.event });
               }
          }
     }
     catch (error) {
          const err = errorHandling(error);
          console.error("User Event Registration Error", err);
          res.status(400).json({ errors: err, message: "User Event Registration Error" });
     }
})



module.exports = router
