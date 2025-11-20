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
app.use('/api/registrationUnit/auth', require('./routes/RegistrationUnitRoute/auth'));
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