// Event Model using Mongoose
// Install: npm install mongoose

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: [true, 'Date is required'],
      trim: true
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    image: {
      type: String,
      default: null
    },
    imagePublicId: {
      type: String,
      default: null
    },
    link: {
      type: String,
      default: '/home',
      trim: true
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

// Index for faster queries
eventSchema.index({ createdAt: -1 });
eventSchema.index({ title: 'text', description: 'text' }); // For text search

// Virtual for formatted date (if needed)
eventSchema.virtual('formattedDate').get(function() {
  return this.date;
});

// Method to get event with image URL
eventSchema.methods.toJSON = function() {
  const event = this.toObject();
  delete event.__v; // Remove version key
  return event;
};

// Static method to find events by date range
eventSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  });
};

const generalEvent = mongoose.model('generalEvent', eventSchema);

module.exports = generalEvent;