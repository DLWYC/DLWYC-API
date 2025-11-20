const mongoose = require('mongoose');

const allocationQueueSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['MALE', 'FEMALE', 'OTHER']
  },
  status: {
    type: String,
    enum: ['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'QUEUED'
  },
  requestTimestamp: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for queue processing
allocationQueueSchema.index({ status: 1, requestTimestamp: 1 });

module.exports = mongoose.model('AllocationQueue', allocationQueueSchema);