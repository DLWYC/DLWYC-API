const express = require('express')
const router = express.Router()
const UserRegisteredEventsModel = require('../../models/userEventsRegistered')
const { userModel } = require('../../models/userModels')
const { errorHandling } = require('../../controllers/errorHandler')


router.get('/:fullName/:uniqueID(.*)', async (req, res) => {
     const { fullName, uniqueID } = req.params

     try {
          const userRegisteredEvent = await UserRegisteredEventsModel.find({ $and: [{ "userProfile.fullName": fullName }, { "userProfile.uniqueID": uniqueID }] })

          console.log(`Congratulation: ${fullName} You Have Gotten Here`, userRegisteredEvent)

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
     const { uniqueID, fullName, email, eventId, eventTitle, registrationStatus, paymentOption, paymentID, paymentStatus, reference, modeOfPayment, paymentTime } = req.body

     // console.log(uniqueID, fullName, email, eventId, eventTitle, registrationStatus, paymentOption, paymentID, paymentStatus, reference, modeOfPayment, paymentTime)

     // First Check if the user with the Email and UniqueID has Registered for an event before
     const event = {
          "eventId": eventId,
          "eventTitle": eventTitle,
          "registrationStatus": registrationStatus,
          "paymentOption": paymentOption,
          "paymentID": paymentID,
          "paymentStatus": paymentStatus,
          "reference": reference,
          "modeOfPayment": modeOfPayment,
          "paymentTime": paymentTime,
     }
     const eventDetails = await new UserRegisteredEventsModel({
          userProfile: {
               "uniqueID": uniqueID,
               "fullName": fullName,
               "email": email
          },
          event: [event]
     })


     const ifUserExists = await userModel.findOne({ $and: [{ "uniqueID": uniqueID }, { "email": email }] })
     const userRegisteredEvent = await UserRegisteredEventsModel.findOne({ $and: [{ "userProfile.uniqueID": uniqueID }, { "userProfile.email": email }] })
     console.log(ifUserExists)
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
                         userRegisteredEvent.save()
                         res.status(200).json({ message: `Registration For ${event.eventTitle} Is Successful` })
                    }
               }


               else {
                    await UserRegisteredEventsModel.create(eventDetails)
                         .then(d => {
                              res.status(200).json({ message: "Event Registered Successfully", data: d.event });
                         })
                         .catch(err => {
                              console.log(err)
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
          console.error(err);
          res.status(400).json({ errors: err, message: "User Event Registration Error" });
     }


})



module.exports = router