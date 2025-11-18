const express = require('express');
const router = express.Router();
const Hostel = require('../../models/hostel');


router.get("/getAvailableHostels/:gender", async (req, res) => {
     try {
          const { gender } = req.params;

          if (!gender || !['Male', 'Female'].includes(gender)) {
               return res.status(400).json({
                    success: false,
                    error: 'Valid gender parameter is required (MALE, Female)'
               });
          }

          const hostels = await Hostel.find({
               genderType: gender,
               isActive: true,
               $expr: { $gt: ['$totalCapacity', '$currentOccupancy'] }
          }).select('roomNumber name totalCapacity currentOccupancy buildingBlock facilities');

          const availableHostels = hostels.map(hostel => ({
               hostel_id: hostel.roomNumber,
               name: hostel.name,
               floor: hostel.floor,
               available_spaces: hostel.availableSpaces,
               building_block: hostel.buildingBlock,
               facilities: hostel.facilities,
               total_capacity: hostel.totalCapacity,
               current_occupancy: hostel.currentOccupancy
          }));

          res.json({
               success: true,
               available_count: availableHostels.length,
               total_spaces: availableHostels.reduce((sum, h) => sum + h.available_spaces, 0),
               hostels: availableHostels
          });
     } catch (error) {
          console.error('Error fetching available hostels:', error);
          res.status(500).json({
               success: false,
               error: 'Failed to fetch available hostels'
          });
     }
});


router.get('/getAllHostels', async (req, res) => {
     try {
          const hostels = await Hostel.find({});
          res.json({ success: true, hostels });
     } catch (error) {
          res.status(500).json({ success: false, error: error.message });
     }
});

router.get("/getHostelById/:id", async (req, res) => {
     try {
          const hostel = await Hostel.findById(req.params.id);
          if (!hostel) {
               return res.status(404).json({ success: false, error: 'Hostel not found' });
          }
          res.json({ success: true, hostel });
     } catch (error) {
          res.status(500).json({ success: false, error: error.message });
     }
});



router.post("/createHostel", async (req, res) => {
     // const {roomNumber, name, genderType, totalCapacity, currentOccupancy, buildingBlock, isActive, facilities} = req.body;
     try {
          const hostel = new Hostel(req.body);
          await hostel.save();
          res.status(201).json({ success: true, hostel });
     } catch (error) {
          res.status(400).json({ success: false, error: error.message });
     }
});

router.patch("/updateHostel/:id", async (req, res) => {
     try {
          const hostel = await Hostel.findByIdAndUpdate(
               req.params.id,
               req.body,
               { new: true, runValidators: true }
          );
          if (!hostel) {
               return res.status(404).json({ success: false, error: 'Hostel not found' });
          }
          res.json({ success: true, hostel });
     } catch (error) {
          res.status(400).json({ success: false, error: error.message });
     }
});

router.delete("/deleteHostel/:id", async (req, res) => {
     try {
          const hostel = await Hostel.findByIdAndDelete(req.params.id);
          if (!hostel) {
               return res.status(404).json({ success: false, error: 'Hostel not found' });
          }
          res.json({ success: true, message: 'Hostel deleted successfully' });
     } catch (error) {
          res.status(500).json({ success: false, error: error.message });
     }
});

module.exports = router;