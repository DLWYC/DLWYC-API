require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 5000
const mongoose = require('mongoose')
const authMiddlware = require('./middleware/auth')

// # :::::: This will allow json data to be passed ::::::
// Increase the payload limit BEFORE your routes
app.use(cors())
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// #  :::::: DataBase Initiallization ::::::
mongoose.connect(process.env.DB_URL)
     .then(() => {
          console.log("DataBase Connected Successfully")
     })
     .catch(err => {
          console.log(`DataBase Connecection Failed: ${err}`)
     })



// # :::::: Routes ::::::
const userRegistration = require('./routes/UserRoute/userRegistration')
const userDashboard = require('./routes/UserRoute/userDashboard')
const userLogin = require('./routes/UserRoute/userLogin')
const userRegisteredEvents = require('./routes/UserRoute/userRegisteredEvent')
const verifyUserPayment = require('./routes/payment')
const registrationUnit = require('./routes/RegistrationUnitRoute/checkin')
const hostelRoutes = require('./routes/HostelRoute/hostelRoute');
const allocationRoutes = require('./routes/HostelRoute/allocationRoutes');
// const userRoutes = require('./routes/HostelRoute/userRoutes');

// ADMIN
const event = require('./routes/AdminRoute/events')

// #::::::::::::::::::::::::::::::::::::::: USER API ENDPOINT :::::::::::::::::::::::::# //
// **** Auth *****
app.use('/api/userRegistration', userRegistration)
app.use('/api/userLogin', userLogin)
// **** Auth *****

// **** Dashboard *****
app.use('/api/userDashboard', authMiddlware, userDashboard)
app.use('/api/payment', verifyUserPayment)
app.use('/api/userRegisteredEvents', userRegisteredEvents)
// **** Dashboard *****





// #::::::::::::::::::::::::::::::::::::::: REGISTRATION UNIT ENDPOINT :::::::::::::::::::::::::# //
app.use('/api/registrationUnit', registrationUnit)
app.use('/api/hostels', hostelRoutes);
app.use('/api/allocations', allocationRoutes);
// app.use('/api/users', userRoutes);







// #::::::::::::::::::::::::::::::::::::::: USER API ENDPOINT :::::::::::::::::::::::::# //
app.use('/api/admin/events', event)


// const unPaidCampers = require('./routes/nonPayers')
// const attendees = require('./routes/attendee')

// const dashboardRegister = require('./routes/dashboardRegister')






// app.use('/api/unPaidCampers', unPaidCampers)
// app.use('/api/attendees', attendees)

// Login
// app.use('/api/dashboard/register', dashboardRegister)
// app.use('/api/dashboard/login', login)

app.listen(PORT, () => {
     console.log(`Connection Successful ${PORT}`)
})



















require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const timeout = require('connect-timeout');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE (ORDER MATTERS!) =====
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(cors());
app.use(morgan('combined')); // Logging
app.use(timeout('30s')); // Request timeout

// Body parsing with limits
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 100
});
app.use('/api/', limiter);

// Timeout handler
app.use((req, res, next) => {
     if (!req.timedout) next();
});

// ===== DATABASE =====
mongoose.connect(process.env.DB_URL, {
     maxPoolSize: 10,
     minPoolSize: 2,
     socketTimeoutMS: 45000,
     serverSelectionTimeoutMS: 5000,
})
.then(() => console.log('✓ Database Connected'))
.catch(err => {
     console.error('✗ Database Connection Failed:', err);
     process.exit(1);
});

// ===== ROUTES =====
const authMiddleware = require('./middleware/auth');

// User routes
app.use('/api/userRegistration', require('./routes/UserRoute/userRegistration'));
app.use('/api/userLogin', require('./routes/UserRoute/userLogin'));
app.use('/api/userDashboard', authMiddleware, require('./routes/UserRoute/userDashboard'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/userRegisteredEvents', require('./routes/UserRoute/userRegisteredEvent'));
app.use('/api/forgotPassword', require('./routes/UserRoute/userForgotPassword'));
app.use('/api/resetPassword', require('./routes/UserRoute/userResetPassword'));

// Registration unit
app.use('/api/registrationUnit', require('./routes/RegistrationUnitRoute/checkin'));
app.use('/api/hostels', require('./routes/HostelRoute/hostelRoute'));
app.use('/api/allocations', require('./routes/HostelRoute/allocationRoutes'));

// Admin routes
app.use('/api/admin/events', require('./routes/AdminRoute/events'));

// ===== ERROR HANDLING =====
// 404 handler
app.use((req, res) => {
     res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
     console.error('Error:', err);
     res.status(err.status || 500).json({
          error: process.env.NODE_ENV === 'production' 
               ? 'Internal server error' 
               : err.message
     });
});

// ===== SERVER STARTUP =====
const server = app.listen(PORT, () => {
     console.log(`✓ Server running on port ${PORT}`);
});

// ===== GRACEFUL SHUTDOWN =====
const gracefulShutdown = () => {
     console.log('Shutting down gracefully...');
     server.close(() => {
          mongoose.connection.close(false, () => {
               console.log('✓ Connections closed');
               process.exit(0);
          });
     });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (err) => {
     console.error('Uncaught Exception:', err);
     process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
     console.error('Unhandled Rejection:', reason);
});


































const Allocation = require('../../models/Allocation');
const { userModel } = require('../../models/userModels');
const Hostel = require('../../models/hostel');
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();


// Generate unique allocation ID
const generateAllocationId = () => {
  return 'A' + Date.now() + Math.random().toString(36).substr(2, 9);
};

router.post("/requestAllocation", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { uniqueId, gender } = req.body;

    // Validate input
    if (!uniqueId || !gender) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'User Unique ID and gender are required'
      });
    }

    if (!['Male', 'Female'].includes(gender)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Invalid gender value'
      });
    }

    // Find user
    const user = await userModel.findOne({ uniqueID: uniqueId }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user already has an active allocation
    if (user.allocationStatus === 'ALLOCATED' || user.allocationStatus === 'CONFIRMED') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'User already has an active allocation'
      });
    }

    // Find available hostels with locking
    const availableHostels = await Hostel.find({
      genderType: gender,
      isActive: true,
      $expr: { $gt: ['$totalCapacity', '$currentOccupancy'] }
    }).session(session);

    if (availableHostels.length === 0) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'NO_AVAILABLE_SPACE',
        message: 'No hostels available for your gender. Please contact administration.'
      });
    }

    // Random selection with balanced distribution
    // Calculate weights based on available spaces
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
      {
        $inc: { currentOccupancy: 1 }
      },
      { new: true, session }
    );

    if (!updatedHostel) {
      await session.abortTransaction();
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

    await allocation.save({ session });

    // Update user
    user.gender = gender;
    user.allocationStatus = 'ALLOCATED';
    user.allocatedHostel = selectedHostel._id;
    user.allocationId = allocationId;
    user.allocatedAt = new Date();
    user.allocationExpiresAt = expiresAt;

    await user.save({ session });

    await session.commitTransaction();

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
    await session.abortTransaction();
    console.error('Allocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process allocation request'
    });
  } finally {
    session.endSession();
  }
});

router.post("/confirmAllocation", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { uniqueId, allocation_id } = req.body;

    if (!uniqueId || !allocation_id) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'User ID and allocation ID are required'
      });
    }

    // Find user
    const user = await userModel.findOne({ uniqueID: uniqueId }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find allocation
    const allocation = await Allocation.findOne({ allocationId: allocation_id }).session(session);
    if (!allocation) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Allocation not found'
      });
    }

    // Check if allocation is expired
    if (new Date() > allocation.expiresAt) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Allocation has expired'
      });
    }

    // Check if already confirmed
    if (allocation.status === 'CONFIRMED') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Allocation already confirmed'
      });
    }

    // Update allocation
    allocation.status = 'CONFIRMED';
    allocation.confirmedAt = new Date();
    await allocation.save({ session });

    // Update user
    user.allocationStatus = 'CONFIRMED';
    await user.save({ session });

    await session.commitTransaction();

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
    await session.abortTransaction();
    console.error('Confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm allocation'
    });
  } finally {
    session.endSession();
  }
});



router.get("/getAllocationStatus/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findOne({ uniqueID: userId })
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { uniqueId, allocation_id } = req.body;

    const user = await userModel.findOne({ uniqueID: uniqueId }).session(session);
    const allocation = await Allocation.findOne({ allocationId: allocation_id }).session(session);

    if (!user || !allocation) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, error: 'User or allocation not found' });
    }

    // Release hostel space
    await Hostel.findByIdAndUpdate(
      allocation.hostel,
      { $inc: { currentOccupancy: -1 } },
      { session }
    );

    // Update allocation
    allocation.status = 'CANCELLED';
    allocation.cancelledAt = new Date();
    await allocation.save({ session });

    // Update user
    user.allocationStatus = 'NOT_STARTED';
    user.allocatedHostel = null;
    user.allocationId = null;
    user.allocatedAt = null;
    user.allocationExpiresAt = null;
    await user.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Allocation cancelled successfully'
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, error: error.message });
  } finally {
    session.endSession();
  }
});

router.get("/getAllocationHistory/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel.findOne({ uniqueID: userId });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const allocations = await Allocation.find({ user: user._id })
      .populate('hostel')
      .sort({ createdAt: -1 });

    res.json({ success: true, allocations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});



module.exports = router;












































































const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hostel_allocation', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Import Routes
const hostelRoutes = require('./routes/hostelRoutes');
const allocationRoutes = require('./routes/allocationRoutes');
const userRoutes = require('./routes/userRoutes');

// Routes
app.use('/api/hostels', hostelRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/users', userRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// ================================================================

// routes/hostelRoutes.js
const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelController');

// Get available hostels by gender
router.get('/available', hostelController.getAvailableHostels);

// Get all hostels (admin)
router.get('/', hostelController.getAllHostels);

// Get single hostel
router.get('/:id', hostelController.getHostelById);

// Create new hostel (admin)
router.post('/', hostelController.createHostel);

// Update hostel (admin)
router.put('/:id', hostelController.updateHostel);

// Delete hostel (admin)
router.delete('/:id', hostelController.deleteHostel);

module.exports = router;

// ================================================================

// routes/allocationRoutes.js
const express = require('express');
const router = express.Router();
const allocationController = require('../controllers/allocationController');

// Request allocation
router.post('/request', allocationController.requestAllocation);

// Confirm allocation
router.post('/confirm', allocationController.confirmAllocation);

// Get allocation status
router.get('/status/:userId', allocationController.getAllocationStatus);

// Cancel allocation
router.post('/cancel', allocationController.cancelAllocation);

// Get allocation history (admin)
router.get('/history/:userId', allocationController.getAllocationHistory);

module.exports = router;

// ================================================================

// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Get user by ID
router.get('/:id', userController.getUserById);

// Create user
router.post('/', userController.createUser);

// Update user
router.put('/:id', userController.updateUser);

module.exports = router;

// ================================================================

// controllers/hostelController.js
const Hostel = require('../models/Hostel');

exports.getAvailableHostels = async (req, res) => {
  try {
    const { gender } = req.query;

    if (!gender || !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      return res.status(400).json({
        success: false,
        error: 'Valid gender parameter is required (MALE, FEMALE, OTHER)'
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
};

exports.getAllHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find({});
    res.json({ success: true, hostels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getHostelById = async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, error: 'Hostel not found' });
    }
    res.json({ success: true, hostel });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.createHostel = async (req, res) => {
  try {
    const hostel = new Hostel(req.body);
    await hostel.save();
    res.status(201).json({ success: true, hostel });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateHostel = async (req, res) => {
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
};

exports.deleteHostel = async (req, res) => {
  try {
    const hostel = await Hostel.findByIdAndDelete(req.params.id);
    if (!hostel) {
      return res.status(404).json({ success: false, error: 'Hostel not found' });
    }
    res.json({ success: true, message: 'Hostel deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================================================================









// controllers/allocationController.js
const Allocation = require('../models/Allocation');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const mongoose = require('mongoose');

// Generate unique allocation ID
const generateAllocationId = () => {
  return 'A' + Date.now() + Math.random().toString(36).substr(2, 9);
};

exports.requestAllocation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user_id, gender } = req.body;

    // Validate input
    if (!user_id || !gender) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'User ID and gender are required'
      });
    }

    if (!['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Invalid gender value'
      });
    }

    // Find user
    const user = await User.findOne({ studentId: user_id }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Check if user already has an active allocation
    if (user.allocationStatus === 'ALLOCATED' || user.allocationStatus === 'CONFIRMED') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'User already has an active allocation'
      });
    }

    // Find available hostels with locking
    const availableHostels = await Hostel.find({
      genderType: gender,
      isActive: true,
      $expr: { $gt: ['$totalCapacity', '$currentOccupancy'] }
    }).session(session);

    if (availableHostels.length === 0) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'NO_AVAILABLE_SPACE',
        message: 'No hostels available for your gender. Please contact administration.'
      });
    }

    // Random selection with balanced distribution
    // Calculate weights based on available spaces
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
      {
        $inc: { currentOccupancy: 1 }
      },
      { new: true, session }
    );

    if (!updatedHostel) {
      await session.abortTransaction();
      return res.status(409).json({
        success: false,
        error: 'Hostel became full during allocation. Please try again.'
      });
    }

    // Create allocation record
    const allocationId = generateAllocationId();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const allocation = new Allocation({
      allocationId,
      user: user._id,
      hostel: selectedHostel._id,
      status: 'PENDING_CONFIRMATION',
      expiresAt,
      allocatedBy: 'SYSTEM'
    });

    await allocation.save({ session });

    // Update user
    user.gender = gender;
    user.allocationStatus = 'ALLOCATED';
    user.allocatedHostel = selectedHostel._id;
    user.allocationId = allocationId;
    user.allocatedAt = new Date();
    user.allocationExpiresAt = expiresAt;

    await user.save({ session });

    await session.commitTransaction();

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
    await session.abortTransaction();
    console.error('Allocation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process allocation request'
    });
  } finally {
    session.endSession();
  }
};

exports.confirmAllocation = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user_id, allocation_id } = req.body;

    if (!user_id || !allocation_id) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'User ID and allocation ID are required'
      });
    }

    // Find user
    const user = await User.findOne({ studentId: user_id }).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Find allocation
    const allocation = await Allocation.findOne({ allocationId: allocation_id }).session(session);
    if (!allocation) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        error: 'Allocation not found'
      });
    }

    // Check if allocation is expired
    if (new Date() > allocation.expiresAt) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Allocation has expired'
      });
    }

    // Check if already confirmed
    if (allocation.status === 'CONFIRMED') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        error: 'Allocation already confirmed'
      });
    }

    // Update allocation
    allocation.status = 'CONFIRMED';
    allocation.confirmedAt = new Date();
    await allocation.save({ session });

    // Update user
    user.allocationStatus = 'CONFIRMED';
    await user.save({ session });

    await session.commitTransaction();

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
    await session.abortTransaction();
    console.error('Confirmation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm allocation'
    });
  } finally {
    session.endSession();
  }
};

exports.getAllocationStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findOne({
      studentId: u































































        / #:::::::::::::::: UPDATE USER PROFILE PICTURE::::::::::::



      require("dotenv").config();
      const celery = require("celery-node");
      const nodemailer = require("nodemailer");
      const { errorHandling } = require("./controllers/errorHandler");
      const worker = celery.createWorker(
        process.env.BROKER_URL,
        process.env.BROKER_URL
      );

      // ## To Create & Connect The Network Successfuly
      const transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      try {
        transporter.verify((error, success) => {
          if (error) {
            console.log(`Error With Node Mailer ${error}`);
          } else {
            console.log(`NodeMailer is ready to send the mails ${success}`);
          }
        });
      } catch(error) {
        const err = errorHandling(err);
        console.log(`Error from Nodemailer Connection ${err}`);
        return err;
      }

worker.register("tasks.sendPaymentEmail", async (args, task) => {
        const { email, uniqueID, fullName, archdeaconry, parish } = args;
        console.log(args);

        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "DLWYC Camp Registration VERIFICATION MAIL",
          html: `
          <div>
          <b>THANK YOU FOR SUCCESSFULLY REGISTERING FOR THE 2024 DIOCESAN YOUTH CONFERENCE.</b>

          <p>
               <b>DATE</b>: 18TH-21ST DECEMBER,2024
               <br/>
               <b>VENUE</b>: CITY OF GOD, MAJIYAGBE LAYOUT, IPAJA
               <br/>
               <b>CHECK-IN TIME</b>: STARTS AT 12:00 NOON
          </p>

          <br/>
           

          CHECKLIST
          ...........................
          <br/>
          

          RULES AN REGULATIONS 
          ......................

          <p>
          Dear <span style='color: #AB0606; font-weight: bold;'> ${fullName} </span> Please kindly note that your <span style='color: #AB0606; font-weight: bold;'> UNIQUE ID: ${uniqueID} </span> is for you alone and it can be use to register for subsequent events easily.

          Remain Blessed & See You There
          </p>
          <b> DLWYC CONFERENCE PLANNING COMMITTEE <b/>
          </div>
          `,
        };

        try {
          const response = await transporter.sendMail(mailOptions);
          console.log(response);
          return response;
        } catch (err) {
          const error = errorHandling(err);
          console.log(`Error from sending email: ${error}`);

          if (
            error.message.include("Unexpected socket close") ||
            error.message.include("connect ENETUNREACH 173.194.79.109:465")
          ) {
            console.log("Temporary Network issues, retrying....");
          } else {
            console.log(error);
          }
        }

        // })
      });

      worker.register("tasks.sendRegistrationEmail", async (args, task) => {
        const { email, uniqueID, fullName, archdeaconry, parish, paymentURL, hostel } = args;
        console.log(args);

        const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: "2024 Camp Registration ",
          html: `
          <div>
          <b>THANK YOU FOR SUCCESSFULLY REGISTERING TO BECOME A PART OF THE DIOCESE OF LAGOS WEST YOUTH CHAPLAINCY FAMILY.</b>

          <p>
               Please Do Well To Note The Following Information Below As They Will Be Used To <span style='color: #AB0606; font-weight: bold;' >Uniquely</span> Identify You As A Member Of DLWYC
          </p>

          <br/>

          <b> Here are your details: </b>
          <ol>
            <li style='color: #AB0606; font-weoght: bold;'>UNIQUE ID: ${uniqueID}</li>
            <li>NAME : ${fullName}</li>  
            ${archdeaconry === null
              ? ""
              : `<li>ARCHDEACONRY: ${archdeaconry}</li>`
            } 
            ${archdeaconry === null ? "" : `<li>PARISH: ${parish}</li>`} 
            <li>HOSTEL: ${hostel} </li>
          </ol>
           
          <p>
         <span> Please kindly note that your <b style='color: #AB0606; font-weight: bold;'>UNIQUE ID: ${uniqueID} </b> is for you alone and it can be use to register for subsequent events easily. </span>
          </p>
          
          <br/>
                    
          <p style='color: red; font-size: 20px;'>  Also, do not forget your sport gear for sports and cultural outfits for the CULTURAL/ VARIETY NIGHT🤗

Most importantly, come along with your plates and cutleries 🍽....... 

You’re welcome😉
</p>


<b> <span style='color: #AB0606'>CHECKLIST:</span> For the “first timers” and the “I don’t know what to pack😩” amongst us🌚👀, relax! We’ve got you covered😉
</b>
          
          <br/>
          <br/>
          <img src='cid:${email}' style="width: 400px; height: auto;"/>
          
          <br/>
          <b> DIOCESAN YOUTH CHAPLAINCY <b/>
          </div>
          `,
          attachments: [
            {
              filename: "checklist.png",
              path: "assets/checklist.jpg",
              cid: email,
            },
          ],
        };

        try {
          const response = await transporter.sendMail(mailOptions);
          console.log(response);
          return response;
        } catch (err) {
          const error = errorHandling(err);
          console.log(`Error from sending email: ${error}`);

          if (
            error.message.include("Unexpected socket close") ||
            error.message.include("connect ENETUNREACH 173.194.79.109:465")
          ) {
            throw new Error("Temporary Network issues, retrying....");
          } else {
            throw error;
          }
        }

        // })
      });

      worker.start();

      // <span> Click The Link Below To Proceed To Make Payment For This Year Camp <b style='color: #AB0606; font-weight: bold;'> <a href=${paymentURL}>Click Here</a> </b> is for you alone and it can be use to register for subsequent events easily. </span>




      routes.patch("/:userId/profile-picture", async (req, res) => {
        const { profilePicture } = req.body;

        try {
          const user = await userModel.findById(req.params.userId);

          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }

          // Delete old image if exists
          if (user.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(user.cloudinaryPublicId);
          }

          // Upload new image
          if (profilePicture) {
            const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
              folder: "user_profiles",
              resource_type: "auto",
              transformation: [
                { width: 500, height: 500, crop: "limit" },
                { quality: "auto" }
              ]
            });

            user.profilePicture = uploadResponse.secure_url;
            user.cloudinaryPublicId = uploadResponse.public_id;
            await user.save();
          }

          res.status(200).json({
            message: "Profile picture updated successfully",
            profilePicture: user.profilePicture
          });
        } catch (err) {
          const error = errorHandling(err);
          res.status(400).json({ error: error });
        }
      });

      // #:::::::::::::::: DELETE USER PROFILE PICTURE ::::::::::::
      routes.delete("/:userId/profile-picture", async (req, res) => {
        try {
          const user = await userModel.findById(req.params.userId);

          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }

          if (user.cloudinaryPublicId) {
            await cloudinary.uploader.destroy(user.cloudinaryPublicId);
            user.profilePicture = null;
            user.cloudinaryPublicId = null;
            await user.save();
          }

          res.status(200).json({ message: "Profile picture deleted successfully" });
        } catch (err) {
          const error = errorHandling(err);
          res.status(400).json({ error: error });
        }
      });


















      import { createContext, useContext, useState } from "react";
      import axios from "axios";
      import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
      const AuthContext = createContext();

      export function AuthProvider({ children }) {
      const baseUrl = import.meta.env.VITE_BASE_URL;
      const [student, setStudent] = useState(null);


      // ***************************  AUTH LOGIN && LOGOUT  *********************************

      // ::::::::: Login Function :::::::::
      const loginMutation = useMutation({
        mutationFn: async (userData) => {
          const { values } = userData;
          // console.log(userData);
          const res = await axios.post(`${baseUrl}/api/login`, values);
          console.log(res, "Login Message");
          return res;
        },
        onSuccess: async (data) => {
          // Get user token and store token in local storage student data
          const { token } = data.data;
          localStorage.setItem("token", token);
          const studentData = await getStudentData(token);
          // Get user token
          setStudent(studentData);
          console.success("Login Successful! 🎉 ");
        },
        onError: (error) => {
          // console.log("This is the error from the Login API Route: ", error);
          console.error(error.response?.data?.loginError || "Login Failed! 🤕 ");
        },
      });

      // ::::::::: Logout Function :::::::::
      const logOut = () => {
        setStudent(null);
        localStorage.setItem("StudentCurrentPosition", "");
        localStorage.setItem("inGeofence", "");
        localStorage.setItem("token", "");
        console.info("LogOut Successful");
      };




      return(
    <AuthContext.Provider
      value={{
      login: loginMutation.mutateAsync,

    }}
    >
    { children }
    </AuthContext.Provider >
  );
}

export const useAuth = () => useContext(AuthContext);
const mongoose = require("mongoose");










































const {
  isEmail,
  isAlpha,
  isMobilePhone,
  isAlphanumeric,
} = require("validator");
const { v4: uuid4 } = require("uuid");
const bcrypt = require('bcrypt')
const { generateUniqueId } = require("../controllers/UniqueNumberGen");

//# Registration Schema & Model
const UserSchema = new mongoose.Schema(
  {
    uniqueID: {
      type: String,
      // default: uuid4(),
    },
    fullName: {
      type: String,
      required: [true, "Please Enter Your Full Name"],
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      lowercase: true,
      validate: [isEmail, "Please Enter A Valid Email"],
    },
    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Please Enter Your Phone Number"],
      validate: [isMobilePhone, "Please Enter A Valid Phone Number"],
    },
    age: {
      type: String,
      required: [true, "Please Enter Your Age"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: [true, "Please Select A Gender"],
    },
    archdeaconry: {
      type: String,
      enum: [
        "Abule Egba",
        "Agege",
        "Amuwo Odofin",
        "Bariga",
        "Cathedral",
        "Egbe",
        "Festac",
        "Gowon Estate",
        "Iba",
        "Idimu",
        "Ijede",
        "Iju-Ishaga",
        "Ikeja",
        "Ikorodu",
        "Ikorodu-North",
        "Ikosi-Ketu",
        "Ikotun",
        "Imota",
        "Ipaja",
        "Isolo",
        "Ogudu",
        "Ojo",
        "Ojo-Alaba",
        "Ojodu",
        "Opebi",
        "Oshodi",
        "Oto-Awori",
        "Owutu",
        "Satellite",
        "Somolu",
      ],
      // required: [true, 'Please Select An Archdeaconry'],
    },
    parish: {
      type: String,
      // required: [true, 'Please Select A Parish'],
    },
    camperType: {
      type: String,
      enum: ["First Timer", "Regular Timer"],
      required: [true, "Please Select An Option"],
    },
    denomination: {
      type: String,
      enum: ["Anglican", "Non-Anglican"],
      required: [true, "Please Select An Option"],
    },
    rulesAndRegulations: {
      type: Boolean,
      default: true,
    },
    payment: {
      paymentOption: {
        type: String
      },
      paymentID: {
        type: Number,
        default: null
      },
      paymentStatus: {
        type: String,
        default: 'Not Payed'
      },
      reference: {
        type: String,
        default: null
      },
      modeOfPayment: {
        type: String,
        default: null
      },
      paymentTime: {
        type: String,
      },
    },
    checkStatus: {
      type: Boolean,
      default: false
    },
    allocatedRoom: {
      type: String
    }
  },
  { timestamps: true }
);

UserSchema.pre("save", function (next) {
  this.uniqueID = generateUniqueId(this.archdeaconry);
  if (this.denomination === "Non-Anglican") {
    this.archdeaconry = null;
    this.parish = null;
    this.payment.paymentOption = "Single"
  }
  next();
});



// Admin
const AdminSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Please Enter Your Full Name"],
      lowercase: true,
    },
    email: {
      type: String,
      required: [true, "Please Enter Your Email"],
      lowercase: true,
      validate: [isEmail, "Please Enter A Valid Email"],
    },
    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
    },
  },
  { timestamps: true }
);

AdminSchema.pre('save', async function (next) {
  const saltRounds = await bcrypt.genSalt()
  this.password = await bcrypt.hash(this.password, saltRounds)
  next()
})

const userModel = new mongoose.model("camper", UserSchema);
const adminModel = new mongoose.model("admin", AdminSchema);
module.exports = { userModel, adminModel };















require("dotenv").config();
const express = require("express");
const routes = express.Router();
const { campersModel } = require("../models/models");
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const celery = require("celery-node");
const client = celery.createClient(process.env.BROKER_URL, process.env.BROKER_URL)
const { initializeTransaction } = require("../utils/initializeTransaction");
const { allocateHostels } = require("../controllers/roomAllocation")


routes.get("/", async (req, res) => {
  campers = await campersModel.find();
  res.json(campers);
});




routes.post("/", cors(), async (req, res) => {
  const { fullName, email, phoneNumber, gender, archdeaconry, parish, age, camperType, denomination, paymentOption, noOfUnpaidCampersOption, noOfCampersToPayFor,
  } = await req.body;
  const allocatedRoom = allocateHostels(fullName, age, gender)
  console.log(allocatedRoom)


  // ## Data to be registered
  const userData = {
    fullName: fullName, email: email, phoneNumber: phoneNumber, gender: gender, age: age, camperType: camperType, denomination: denomination,
  };



  //   TRY && CATCH
  try {

    //  ########## Collation of user Info
    if (denomination === "Non-Anglican") {
      camper = await new campersModel({ ...userData, allocatedRoom: allocatedRoom.data.room });
    } else {
      camper = await new campersModel({
        ...userData,
        archdeaconry: archdeaconry,
        parish: parish,
        allocatedRoom: allocatedRoom.data.room
      });
    }
    //  ########## Collation of user Info


    // ########### Store the User Data in the DB
    await campersModel.create(camper)
      .then(async (d) => {

        // // Send This details to the celery worker to send the email
        const task = client.sendTask("tasks.sendRegistrationEmail", [
          {
            email: d.email,
            uniqueID: d.uniqueID,
            fullName: d.fullName,
            archdeaconry: d.archdeaconry,
            parish: d.parish,
            hostel: allocatedRoom.data.room
          },
        ]);
        task
          .get()
          .then((response) => {
            console.log(`response from Worker ${response}`);
          })
          .catch((err) => {
            console.log(`Error in FE fron Worker ${err}`);
          });
        // console.log(`This is the Task ${task}`)
        //   // Send This details to the celery worker to send the email

        // res.status(200).json({ message: "Registration Successful", paymentUrl: paymentURL });
        res.status(200).json({ message: "Registration Successful" });
      })
      .catch((err) => {
        throw err;
      });



  } catch (err) {
    const error = errorHandling(err);
    console.log(error)
    res.status(400).json({ errors: error, message: 'Input Errors' });
  }
  //   TRY && CATCH


});

module.exports = routes;
