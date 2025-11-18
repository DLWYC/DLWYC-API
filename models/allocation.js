const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema({
  allocationId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING_CONFIRMATION', 'CONFIRMED', 'EXPIRED', 'CANCELLED'],
    default: 'PENDING_CONFIRMATION'
  },
  allocatedBy: {
    type: String,
    enum: ['SYSTEM', 'ADMIN'],
    default: 'SYSTEM'
  },
  allocatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  confirmedAt: {
    type: Date,
    default: null
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index for faster queries
allocationSchema.index({ user: 1, status: 1 });
allocationSchema.index({ allocationId: 1 });
allocationSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Allocation', allocationSchema);