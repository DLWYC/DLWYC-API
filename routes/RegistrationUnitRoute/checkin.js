const express = require('express');
const router = express.Router();
const eventModel = require('../../models/eventsModel');
const UserRegisteredEventsModel = require('../../models/userEventsRegistered');
const { errorHandling } = require('../../controllers/errorHandler');


router.get('/allEvents', async (req, res) => {
     try {
          const events = await eventModel.find({});
          res.status(200).json({ events });
     }
     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({ errors: error });
     }
})


router.get('/eventAttendees/:eventTitle(.*)', async (req, res) => {
     const { eventTitle } = req.params;
     try {
          const eventAttendees = await UserRegisteredEventsModel.find({
               'event.eventTitle': eventTitle
          });

          if (eventAttendees.length === 0) {
               return res.status(200).json({ message: "No attendees found for this event", data: [] });
          }

          const attendeesWithEventInfo = eventAttendees.map(attendee => {
               const matchingEvent = attendee.event.find(evt => evt.eventTitle === eventTitle);

               return {
                    userId: attendee?._id,
                    uniqueId: attendee?.userProfile?.uniqueID,
                    fullName: attendee?.userProfile?.fullName,
                    email: attendee?.userProfile?.email,
                    eventDetails: matchingEvent
               };
          }).filter(item => item.eventDetails); // Only include if event was found

          res.status(200).json({ message: "Attendees Found", data: attendeesWithEventInfo });
     }
     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({ errors: error });
     }
});




// :::::::::  Check  IN  :::::::::::
router.patch('/eventAttendees/:userId/checkIn', async (req, res) => {
     const { userId } = req.params;
     const { eventTitle } = req.body;

     console.log("Checking in user:", userId, "for event:", eventTitle);

     try {
          // Find the user and update the specific event's check-in status
          const user = await UserRegisteredEventsModel.findById(userId);

          if (!user) {
               return res.status(404).json({ error: 'User not found' });
          }

          // Find the event in the user's events array
          const eventIndex = user.event.findIndex(evt => evt.eventTitle === eventTitle);

          if (eventIndex === -1) {
               return res.status(404).json({ error: 'Event not found for this user' });
          }

          if (user.event[eventIndex].checkedInStatus === true) {
               return res.status(200).json({ message: 'User already checked in for this event' });
          }

          // Update the check-in status and time
          user.event[eventIndex].checkedInStatus = true;
          user.event[eventIndex].checkInTime = Date.now();

          // Save the updated user document
          await user.save();

          console.log("Check-in successful for:", user?.userProfile?.fullName);
          res.status(200).json({
               message: 'Check-in successful',
               userId: user._id,
               userName: user?.userProfile?.fullName,
               eventDetails: user.event[eventIndex]
          });
     }
     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({ errors: error });
     }
});





// :::::::::::::::: Undo Check IN :::::::::::::::

// Route to undo check-in
router.patch('/eventAttendees/:userId/undoCheckIn', async (req, res) => {
     const { userId } = req.params;
     const { eventTitle } = req.body;

     console.log("Undoing check-in for user:", userId, "for event:", eventTitle);

     try {
          const user = await UserRegisteredEventsModel.findById(userId);

          if (!user) {
               return res.status(404).json({ error: 'User not found' });
          }

          const eventIndex = user.event.findIndex(evt => evt.eventTitle === eventTitle);

          if (eventIndex === -1) {
               return res.status(404).json({ error: 'Event not found for this user' });
          }


          if (user.event[eventIndex].checkedInStatus === false) {
               return res.status(200).json({ message: 'User is not checked in for this event' });
          }

          // Reset check-in status
          user.event[eventIndex].checkedInStatus = false;
          user.event[eventIndex].checkInTime = null;

          await user.save();

          console.log("Check-in undone for:", user?.userProfile?.fullName);
          res.status(200).json({
               message: 'Check-in undone successfully',
               userId: user._id,
               userName: user?.userProfile?.fullName,
               eventDetails: user.event[eventIndex]
          });
     }
     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({ errors: error });
     }
});





// :::::::::: Batch Check IN ::::::::::::
router.patch('/eventAttendees/bulkCheckIn', async (req, res) => {
     const { userIds, eventTitle } = req.body;

     console.log("Bulk checking in users for event:", eventTitle);

     try {
          const results = [];

          for (const userId of userIds) {
               const user = await UserRegisteredEventsModel.findById(userId);

               if (user) {
                    const eventIndex = user.event.findIndex(evt => evt.eventTitle === eventTitle);

                    if (eventIndex !== -1 && !user.event[eventIndex].checkedInStatus) {
                         user.event[eventIndex].checkedInStatus = true;
                         user.event[eventIndex].checkInTime = Date.now();
                         await user.save();
                         results.push({ userId, success: true, userName: user?.userProfile?.fullName });
                    } else {
                         results.push({ userId, success: false, reason: 'Already checked in or event not found' });
                    }
               } else {
                    results.push({ userId, success: false, reason: 'User not found' });
               }
          }

          const successCount = results.filter(r => r.success).length;

          res.status(200).json({
               message: `${successCount} users checked in successfully`,
               results
          });
     }
     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({ errors: error });
     }
});


// :::::::::: Undo Batch Check IN ::::::::::::
router.patch('/eventAttendees/bulkCheckOut', async (req, res) => {
     const { userIds, eventTitle } = req.body;

     console.log("Bulk checking in users for event:", eventTitle);

     try {
          const results = [];

          for (const userId of userIds) {
               const user = await UserRegisteredEventsModel.findById(userId);

               if (user) {
                    const eventIndex = user.event.findIndex(evt => evt.eventTitle === eventTitle);

                    if (eventIndex !== -1 && user.event[eventIndex].checkedInStatus) {
                         user.event[eventIndex].checkedInStatus = false;
                         user.event[eventIndex].checkInTime = Date.now();
                         await user.save();
                         results.push({ userId, success: false, userName: user?.userProfile?.fullName });
                    } else {
                         results.push({ userId, success: true, reason: 'Already checked Out or event not found' });
                    }
               } else {
                    results.push({ userId, success: false, reason: 'User not found' });
               }
          }

          const successCount = results.filter(r => r.success).length;

          res.status(200).json({
               message: `${successCount} users checked Out successfully`,
               results
          });
     }
     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({ errors: error });
     }
});






module.exports = router;