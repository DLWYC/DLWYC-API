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
     const { uniqueID, fullName, email, eventId, eventTitle, registrationStatus, paymentOption, reference, paymentStatus, modeOfPayment, paymentTime, paymentID } = req.body

     console.log(uniqueID, fullName, email, eventId, eventTitle, registrationStatus, paymentOption, reference, paymentStatus, modeOfPayment, paymentTime, paymentID)

     // First Check if the user with the Email and UniqueID has Registered for an event before
     const event = {
          "eventId": eventId, //
          "eventTitle": eventTitle, //
          "registrationStatus": modeOfPayment == 'Code' ? true : paymentStatus == 'success' ? true : false,
          "paymentStatus": modeOfPayment == 'Code' ? 'success' : paymentStatus,
          "reference": reference,
          "modeOfPayment": modeOfPayment,
          "paymentTime": modeOfPayment ? new Date() : paymentTime,
          "paymentOption": paymentOption,
          "paymentID": paymentID,
     }


     console.log("Tjs is the sudjsdf", event)
     const eventDetails = new UserRegisteredEventsModel({
          userProfile: {
               "uniqueID": uniqueID, //
               "fullName": fullName, //
               "email": email //
          },
          event: [event]
     })


     const ifUserExists = await userModel.findOne({ $and: [{ "uniqueID": uniqueID }, { "email": email }] })
     const userRegisteredEvent = await UserRegisteredEventsModel.findOne({ $and: [{ "userProfile.uniqueID": uniqueID }, { "userProfile.email": email }] })

     try {
          if (ifUserExists) {

               if (userRegisteredEvent) {
                    const userevents = await userRegisteredEvent.event

                    // Check To See If there are no two events with the same id
                    if (await userevents.some(events => events.eventId === event.eventId)) {
                         throw new Error("Cannot Register For The Same Event Twice");
                    }
                    else {
                         await userevents.push(event)
                         switch (paymentStatus) {
                              case 'success':
                                   res.status(200).json({ message: `Registration Successful` })
                                   userRegisteredEvent.save()
                                   break;
                              case 'failed':
                                   res.status(200).json({ message: `Registration Failed` })
                                   userRegisteredEvent.save()
                                   break;
                              case 'abandoned':
                                   res.status(200).json({ message: `Registration Abandoned` })
                                   break;
                              default:
                                   console.log("Interesting")
                                   break;

                         }
                    }
               }
               else {
                    await UserRegisteredEventsModel.create(eventDetails)
                         .then(d => {
                              switch (paymentStatus) {
                                   case 'success':
                                        res.status(200).json({ message: "Registered Successfully", data: d.event });
                                        break;
                                   case 'failed':
                                        res.status(200).json({ message: `Registration Failed`, data: d.event })
                                        break;
                                   case 'abandoned':
                                        res.status(200).json({ message: `Registration Abandoned` })
                                        break;
                                   default:
                                        console.log("Interesting")
                                        break;
                              }

                         })
                         .catch(err => {
                              console.log("Error Saving Registration DEtails", err)
                              throw (err)
                         })
               }
          }

          else {
               res.status(400).json({ message: `Sorry This User ${fullName} Does Not Have Any Account`, location: "User Registration EndPoint" });
          }
     }
     catch (error) {
          const err = errorHandling(error);
          console.error("This is Effor Create USed Registration DEtails", err);
          res.status(400).json({ errors: err, message: "User Event Registration Error" });
     }


})



module.exports = router