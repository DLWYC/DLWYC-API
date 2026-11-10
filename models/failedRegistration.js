const mongoose = require('mongoose')

const FailedRegistrationSchema = new mongoose.Schema({
     userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'user',
          required: true
     },
     eventId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'events',
          required: true
     },
     reference: {
          type: String,
          required: true,
          unique: true
     },
     amountPaidInKobo: {
          type: Number,
          required: true
     },
     reason: {
          type: String,
          required: true
     },
     refundStatus: {
          type: String,
          enum: ['Pending Refund', 'Processing', 'Refunded', 'Failed'],
          default: 'Pending Refund'
     },
     paystackRefundId: {
          type: String,
          default: null
     },
     refundedAt: {
          type: Date,
          default: null
     }
}, { timestamps: true });

const FailedRegistrationModel = new mongoose.model('failed_registration', FailedRegistrationSchema)
module.exports = { FailedRegistrationModel }