// Express.js API endpoint for creating events with Cloudinary and MongoDB
// Install dependencies: npm install express cloudinary mongoose dotenv

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const Event = require('../../models/generalEvents'); // Adjust path as needed

// Configure Cloudinary
cloudinary.config({
     cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
     api_key: process.env.CLOUDINARY_API_KEY,
     api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (base64Image, folder = 'events') => {
     try {
          const result = await cloudinary.uploader.upload(base64Image, {
               folder: folder,
               resource_type: 'image',
               transformation: [
                    { width: 1200, height: 800, crop: 'limit' },
                    { quality: 'auto' }
               ]
          });
          return result;
     } catch (error) {
          throw new Error('Cloudinary upload failed: ' + error.message);
     }
};

// POST /events - Create a new event with image upload
router.post('/events', async (req, res) => {
     try {
          const { date, title, description, link, image } = req.body;

          // Validation
          if (!title || !title.trim()) {
               return res.status(400).json({
                    success: false,
                    error: 'Title is required'
               });
          }

          if (!date || !date.trim()) {
               return res.status(400).json({
                    success: false,
                    error: 'Date is required'
               });
          }

          if (!description || !description.trim()) {
               return res.status(400).json({
                    success: false,
                    error: 'Description is required'
               });
          }

          // Upload image to Cloudinary if provided
          let imageUrl = null;
          let imagePublicId = null;

          if (image) {
               try {
                    const uploadResult = await uploadToCloudinary(image);
                    imageUrl = uploadResult.secure_url;
                    imagePublicId = uploadResult.public_id;
               } catch (uploadError) {
                    console.error('Cloudinary upload error:', uploadError);
                    return res.status(500).json({
                         success: false,
                         error: 'Failed to upload image: ' + uploadError.message
                    });
               }
          }

          // Create new event in database
          const newEvent = await Event.create({
               date: date.trim(),
               title: title.trim(),
               description: description.trim(),
               image: imageUrl,
               imagePublicId: imagePublicId,
               link: link?.trim() || '/home'
          });

          // Return success response
          res.status(201).json({
               success: true,
               message: 'Event created successfully',
               data: newEvent
          });

     } catch (error) {
          console.error('Error creating event:', error);

          // Handle mongoose validation errors
          if (error.name === 'ValidationError') {
               const messages = Object.values(error.errors).map(err => err.message);
               return res.status(400).json({
                    success: false,
                    error: messages.join(', ')
               });
          }

          res.status(500).json({
               success: false,
               error: error.message || 'Internal server error'
          });
     }
});

// GET /events - Retrieve all events
router.get('/events', async (req, res) => {
     try {
          const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

          const events = await Event.find()
               .sort(sort)
               .limit(limit * 1)
               .skip((page - 1) * limit)
               .exec();

          const count = await Event.countDocuments();

          res.status(200).json({
               success: true,
               count: events.length,
               total: count,
               totalPages: Math.ceil(count / limit),
               currentPage: page,
               data: events
          });
     } catch (error) {
          console.error('Error fetching events:', error);
          res.status(500).json({
               success: false,
               error: error.message || 'Internal server error'
          });
     }
});

// GET /events/:id - Retrieve a single event
router.get('/events/:id', async (req, res) => {
     try {
          const event = await Event.findById(req.params.id);

          if (!event) {
               return res.status(404).json({
                    success: false,
                    error: 'Event not found'
               });
          }

          res.status(200).json({
               success: true,
               data: event
          });
     } catch (error) {
          console.error('Error fetching event:', error);

          if (error.kind === 'ObjectId') {
               return res.status(404).json({
                    success: false,
                    error: 'Event not found'
               });
          }

          res.status(500).json({
               success: false,
               error: error.message || 'Internal server error'
          });
     }
});

// PUT /events/:id - Update an event with optional new image
router.put('/events/:id', async (req, res) => {
     try {
          const event = await Event.findById(req.params.id);

          if (!event) {
               return res.status(404).json({
                    success: false,
                    error: 'Event not found'
               });
          }

          const { date, title, description, link, image } = req.body;
          let imageUrl = event.image;
          let imagePublicId = event.imagePublicId;

          // If new image is provided, delete old one and upload new
          if (image) {
               try {
                    // Delete old image from Cloudinary if it exists
                    if (event.imagePublicId) {
                         await cloudinary.uploader.destroy(event.imagePublicId);
                    }

                    // Upload new image
                    const uploadResult = await uploadToCloudinary(image);
                    imageUrl = uploadResult.secure_url;
                    imagePublicId = uploadResult.public_id;
               } catch (uploadError) {
                    console.error('Cloudinary upload error:', uploadError);
                    return res.status(500).json({
                         success: false,
                         error: 'Failed to upload image: ' + uploadError.message
                    });
               }
          }

          // Update event fields
          event.date = date || event.date;
          event.title = title || event.title;
          event.description = description || event.description;
          event.image = imageUrl;
          event.imagePublicId = imagePublicId;
          event.link = link || event.link;

          await event.save();

          res.status(200).json({
               success: true,
               message: 'Event updated successfully',
               data: event
          });

     } catch (error) {
          console.error('Error updating event:', error);

          if (error.kind === 'ObjectId') {
               return res.status(404).json({
                    success: false,
                    error: 'Event not found'
               });
          }

          if (error.name === 'ValidationError') {
               const messages = Object.values(error.errors).map(err => err.message);
               return res.status(400).json({
                    success: false,
                    error: messages.join(', ')
               });
          }

          res.status(500).json({
               success: false,
               error: error.message || 'Internal server error'
          });
     }
});

// DELETE /events/:id - Delete an event and its image
router.delete('/events/:id', async (req, res) => {
     try {
          const event = await Event.findById(req.params.id);

          if (!event) {
               return res.status(404).json({
                    success: false,
                    error: 'Event not found'
               });
          }

          // Delete image from Cloudinary if it exists
          if (event.imagePublicId) {
               try {
                    await cloudinary.uploader.destroy(event.imagePublicId);
               } catch (deleteError) {
                    console.error('Error deleting image from Cloudinary:', deleteError);
               }
          }

          await Event.findByIdAndDelete(req.params.id);

          res.status(200).json({
               success: true,
               message: 'Event deleted successfully'
          });

     } catch (error) {
          console.error('Error deleting event:', error);

          if (error.kind === 'ObjectId') {
               return res.status(404).json({
                    success: false,
                    error: 'Event not found'
               });
          }

          res.status(500).json({
               success: false,
               error: error.message || 'Internal server error'
          });
     }
});

module.exports = router;

/* 
SETUP INSTRUCTIONS:
1. Install dependencies: npm install express cloudinary mongoose dotenv

2. Create a .env file with:
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   MONGODB_URI=mongodb://localhost:27017/your_database
   # Or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

3. Create models/Event.js (see Event Model artifact)

4. Usage in your main app.js:
const express = require('express');
const mongoose = require('mongoose');
const eventRoutes = require('./routes/events');
require('dotenv').config();

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(eventRoutes);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});

5. Frontend Example remains the same - send base64 image in JSON
*/