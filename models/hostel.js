const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
     roomNumber: {
          type: String,
          required: true,
          unique: true,
          trim: true
     },
     name: {
          type: String,
          required: true,
          trim: true
     },
     genderType: {
          type: String,
          required: true,
          enum: ['Male', 'Female']
     },
     totalCapacity: {
          type: Number,
          required: true,
          min: 0
     },
     currentOccupancy: {
          type: Number,
          required: true,
          default: 0,
          min: 0
     },
     buildingBlock: {
          type: String,
          trim: true
     },
     floor: {
          type: String,
          trim: true
     },
     isActive: {
          type: Boolean,
          default: true
     },
     facilities: [{
          type: String
     }],
     description: {
          type: String,
          trim: true
     }
}, {
     timestamps: true
});


// Virtual field for available spaces
hostelSchema.virtual('availableSpaces').get(function () {
     return this.totalCapacity - this.currentOccupancy;
});

// Ensure virtuals are included in JSON
hostelSchema.set('toJSON', { virtuals: true });
hostelSchema.set('toObject', { virtuals: true });

// Index for faster queries
hostelSchema.index({ genderType: 1, isActive: 1 });
hostelSchema.index({ roomNumber: 1 });

// Validation to ensure occupancy doesn't exceed capacity
hostelSchema.pre('save', function (next) {
     if (this.currentOccupancy > this.totalCapacity) {
          next(new Error('Current occupancy cannot exceed total capacity'));
     }
     next();
});

module.exports = mongoose.model('Hostel', hostelSchema);