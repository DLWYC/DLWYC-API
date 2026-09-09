const mongoose = require('mongoose');

const EventReservationSchema = new mongoose.Schema({
     eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
     userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     reference: { type: String, required: true, unique: true }, // The Paystack Reference
     amountOfPeople: { type: Number, required: true }, 
     createdAt: { type: Date, default: Date.now }
     
});

// ⚡ THE MAGIC LINE: Automatically delete this document after 10 minutes (600 seconds)
EventReservationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 200 });
EventReservationSchema.index({ eventId: 1, userId: 1 }, { unique: true }); // Ensure a user can only have one reservation per event

const EventReservationModel = new mongoose.model('event_reservation_list', EventReservationSchema);
module.exports = {EventReservationModel}
