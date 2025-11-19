const { userModel } = require('../../models/userModels');
const Hostel = require('../../models/hostel');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Generate unique allocation ID
const generateAllocationId = () => {
     return 'A' + Date.now() + Math.random().toString(36).substr(2, 9);
};

// Helper function to check if transactions are supported
const supportsTransactions = () => {
     try {
          const topology = mongoose.connection?.client?.topology;
          if (!topology) return false;

          const description = topology.description;
          return description.type === 'ReplicaSetWithPrimary' ||
               description.type === 'ReplicaSetNoPrimary' ||
               description.type === 'Sharded';
     } catch (error) {
          return false;
     }
};

// Helper to start session if transactions are supported
const startSessionIfSupported = async () => {
     if (supportsTransactions()) {
          const session = await mongoose.startSession();
          await session.startTransaction();
          return session;
     }
     return null;
};

// Helper to add session to query if it exists
const addSession = (session) => {
     return session ? { session } : {};
};

router.post("/requestAllocation", async (req, res) => {
     let session = null;

     try {
          session = await startSessionIfSupported();
          const { uniqueId, gender } = req.body;

          // Validate input
          if (!uniqueId || !gender) {
               if (session) await session.abortTransaction();
               return res.status(400).json({
                    success: false,
                    error: 'User Unique ID and gender are required'
               });
          }

          if (!['Male', 'Female'].includes(gender)) {
               if (session) await session.abortTransaction();
               return res.status(400).json({
                    success: false,
                    error: 'Invalid gender value'
               });
          }

          // Find user
          const user = await userModel.findOne({ uniqueID: uniqueId }, null, addSession(session));
          if (!user) {
               if (session) await session.abortTransaction();
               return res.status(404).json({
                    success: false,
                    error: 'User not found'
               });
          }

          // Check if user already has an active allocation
          if (user.allocationStatus === 'ALLOCATED' || user.allocationStatus === 'CONFIRMED') {
               if (session) await session.abortTransaction();
               return res.status(400).json({
                    success: false,
                    error: 'User already has an active allocation'
               });
          }

          // Find available hostels
          const availableHostels = await Hostel.find({
               genderType: gender,
               isActive: true,
               $expr: { $gt: ['$totalCapacity', '$currentOccupancy'] }
          }, null, addSession(session));

          if (availableHostels.length === 0) {
               if (session) await session.abortTransaction();
               return res.status(404).json({
                    success: false,
                    error: 'NO_AVAILABLE_SPACE',
                    message: 'No hostels available for your gender. Please contact administration.'
               });
          }

          // Random selection with balanced distribution
          const totalAvailableSpaces = availableHostels.reduce(
               (sum, h) => sum + (h.totalCapacity - h.currentOccupancy),
               0
          );

          let random = Math.random() * totalAvailableSpaces;
          let selectedHostel = null;

          for (const hostel of availableHostels) {
               const availableSpace = hostel.totalCapacity - hostel.currentOccupancy;
               random -= availableSpace;
               if (random <= 0) {
                    selectedHostel = hostel;
                    break;
               }
          }

          if (!selectedHostel) {
               selectedHostel = availableHostels[0];
          }

          // Update hostel occupancy atomically
          const updatedHostel = await Hostel.findOneAndUpdate(
               {
                    _id: selectedHostel._id,
                    $expr: { $gt: ['$totalCapacity', '$currentOccupancy'] }
               },
               { $inc: { currentOccupancy: 1 } },
               { new: true, ...addSession(session) }
          );

          if (!updatedHostel) {
               if (session) await session.abortTransaction();
               return res.status(409).json({
                    success: false,
                    error: 'Hostel became full during allocation. Please try again.'
               });
          }

          // Create allocation record
          const allocationId = generateAllocationId();
          const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours

          const allocation = new Allocation({
               allocationId,
               user: user._id,
               hostel: selectedHostel._id,
               status: 'PENDING_CONFIRMATION',
               expiresAt,
               allocatedBy: 'SYSTEM'
          });

          await allocation.save(addSession(session));

          // Update user
          user.gender = gender;
          user.allocationStatus = 'ALLOCATED';
          user.allocatedHostel = selectedHostel._id;
          user.allocationId = allocationId;
          user.allocatedAt = new Date();
          user.allocationExpiresAt = expiresAt;
          user.uniqueID = uniqueId; // Ensure uniqueID is set

          await user.save(addSession(session));

          if (session) await session.commitTransaction();

          res.status(201).json({
               success: true,
               allocation: {
                    allocation_id: allocationId,
                    hostel_id: selectedHostel.roomNumber,
                    hostel_name: selectedHostel.name,
                    building_block: selectedHostel.buildingBlock,
                    allocated_at: allocation.allocatedAt.toISOString(),
                    expires_at: expiresAt.toISOString(),
                    status: 'PENDING_CONFIRMATION'
               }
          });

     } catch (error) {
          if (session) await session.abortTransaction();
          console.error('Allocation error:', error);
          res.status(500).json({
               success: false,
               error: 'Failed to process allocation request'
          });
     } finally {
          if (session) session.endSession();
     }
});


router.post("/confirmAllocation", async (req, res) => {
     let session = null;

     try {
          session = await startSessionIfSupported();
          const { uniqueId, allocation_id } = req.body;

          if (!uniqueId || !allocation_id) {
               if (session) await session.abortTransaction();
               return res.status(400).json({
                    success: false,
                    error: 'User ID and allocation ID are required'
               });
          }

          // Find user
          const user = await userModel.findOne({ uniqueID: uniqueId }, null, addSession(session));
          if (!user) {
               if (session) await session.abortTransaction();
               return res.status(404).json({
                    success: false,
                    error: 'User not found'
               });
          }

          // Find allocation
          const allocation = await Allocation.findOne({ allocationId: allocation_id }, null, addSession(session));
          if (!allocation) {
               if (session) await session.abortTransaction();
               return res.status(404).json({
                    success: false,
                    error: 'Allocation not found'
               });
          }

          // Check if allocation is expired
          if (new Date() > allocation.expiresAt) {
               if (session) await session.abortTransaction();
               return res.status(400).json({
                    success: false,
                    error: 'Allocation has expired'
               });
          }

          // Check if already confirmed
          if (allocation.status === 'CONFIRMED') {
               if (session) await session.abortTransaction();
               return res.status(400).json({
                    success: false,
                    error: 'Allocation already confirmed'
               });
          }

          // Update allocation
          allocation.status = 'CONFIRMED';
          allocation.confirmedAt = new Date();
          await allocation.save(addSession(session));

          // Update user
          user.allocationStatus = 'CONFIRMED';
          await user.save(addSession(session));

          if (session) await session.commitTransaction();

          res.json({
               success: true,
               message: 'Allocation confirmed successfully',
               allocation: {
                    allocation_id: allocation.allocationId,
                    status: 'CONFIRMED',
                    confirmed_at: allocation.confirmedAt.toISOString()
               }
          });

     } catch (error) {
          if (session) await session.abortTransaction();
          console.error('Confirmation error:', error);
          res.status(500).json({
               success: false,
               error: 'Failed to confirm allocation'
          });
     } finally {
          if (session) session.endSession();
     }
});




router.get("/getAllocationStatus/:uniqueId(.*)", async (req, res) => {
     try {
          const { uniqueId } = req.params;

          const user = await userModel.findOne({ uniqueID: uniqueId })
               .populate('allocatedHostel');

          if (!user) {
               return res.status(404).json({
                    success: false,
                    error: 'User not found'
               });
          }

          if (user.allocationStatus === 'NOT_STARTED') {
               return res.json({
                    success: true,
                    status: 'NOT_STARTED',
                    message: 'No allocation found'
               });
          }

          const allocation = await Allocation.findOne({ allocationId: user.allocationId })
               .populate('hostel');

          res.json({
               success: true,
               status: user.allocationStatus,
               allocation: allocation ? {
                    allocation_id: allocation.allocationId,
                    hostel: {
                         name: allocation.hostel.name,
                         hostel_id: allocation.hostel.roomNumber,
                         building_block: allocation.hostel.buildingBlock
                    },
                    allocated_at: allocation.allocatedAt.toISOString(),
                    expires_at: allocation.expiresAt?.toISOString(),
                    confirmed_at: allocation.confirmedAt?.toISOString(),
                    status: allocation.status
               } : null
          });

     } catch (error) {
          console.error('Status check error:', error);
          res.status(500).json({
               success: false,
               error: 'Failed to fetch allocation status'
          });
     }
});





router.post("/cancelAllocation", async (req, res) => {
     let session = null;

     try {
          session = await startSessionIfSupported();
          const { uniqueId, allocation_id } = req.body;

          const user = await userModel.findOne({ uniqueID: uniqueId }, null, addSession(session));
          const allocation = await Allocation.findOne({ allocationId: allocation_id }, null, addSession(session));

          if (!user || !allocation) {
               if (session) await session.abortTransaction();
               return res.status(404).json({
                    success: false,
                    error: 'User or allocation not found'
               });
          }

          if (user.allocationStatus !== 'ALLOCATED' && user.allocationStatus !== 'PENDING') {
               if (session) await session.abortTransaction();
               return res.status(400).json({
                    success: false,
                    error: 'Allocation cannot be cancelled in its current status'
               });
          }

          // Release hostel space
          await Hostel.findByIdAndUpdate(
               allocation.hostel,
               { $inc: { currentOccupancy: -1 } },
               addSession(session)
          );

          // Update allocation
          allocation.status = 'CANCELLED';
          allocation.cancelledAt = new Date();
          await allocation.save(addSession(session));

          // Update user
          user.allocationStatus = 'NOT_STARTED';
          user.allocatedHostel = null;
          user.allocationId = null;
          user.allocatedAt = null;
          user.allocationExpiresAt = null;
          await user.save(addSession(session));

          if (session) await session.commitTransaction();

          res.json({
               success: true,
               message: 'Allocation cancelled successfully'
          });

     } catch (error) {
          if (session) await session.abortTransaction();
          console.error('Cancellation error:', error);
          res.status(500).json({
               success: false,
               error: error.message
          });
     } finally {
          if (session) session.endSession();
     }
});




router.get("/getAllocationHistory/:userId", async (req, res) => {
     try {
          const { userId } = req.params;

          const user = await userModel.findOne({ uniqueID: userId });
          if (!user) {
               return res.status(404).json({
                    success: false,
                    error: 'User not found'
               });
          }

          const allocations = await Allocation.find({ user: user._id })
               .populate('hostel')
               .sort({ createdAt: -1 });

          res.json({
               success: true,
               allocations
          });
     } catch (error) {
          console.error('History fetch error:', error);
          res.status(500).json({
               success: false,
               error: error.message
          });
     }
});

module.exports = router;