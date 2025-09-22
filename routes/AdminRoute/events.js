const express = require('express')
const router = express.Router()
const eventModel = require('../../models/eventsModel')
const { errorHandling } = require("../../controllers/errorHandler");



router.get('/', async (req, res) => {
     const allEvents = await eventModel.find()

     if (allEvents.length <= 0) {
          res.status(400).json({ errors: "No Event Created", })
     }

     res.status(200).json({message: "Events Found", data: allEvents})

})


router.post('/', async (req, res) => {
     const { eventTitle, eventDate, eventLocation, eventTime, eventDescription } = req.body
     const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

     const findExisingTitle = await eventModel.findOne({
          eventTitle: { $regex: `^${escapeRegex(eventTitle)}$`, $options: 'i' }
     });

     try {
          if (findExisingTitle) {
               throw new Error("Can't Create an Event Twice")
          }

          const eventData = await new eventModel({
               eventTitle: eventTitle,
               eventDate: eventDate,
               eventLocation: eventLocation,
               eventTime: eventTime,
               eventDescription: eventDescription
          })

          const event = await eventModel.create(eventData)
          if (event) {
               res.status(200).json({ message: "Event Created Successfully", data: event.eventTitle })
          }
          else {
               throw new Error("Error Creating Event")
          }
     }
     catch (error) {
          const err = errorHandling(error);
          console.error(err);
          res.status(400).json({ errors: err, message: "Event Creation Error" });
     }
})

module.exports = router