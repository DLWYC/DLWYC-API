const express = require("express");
const router = express.Router();
const { LoginController, UserRefreshTokenController, NewUserRegistrationController, RequestForgetPasswordLinkController, ResetUserPasswordController, LogOutController } = require("../../controllers/authenticationController");
const authenticateToken = require('../../middlewares/authentication')

// Authentication Routes
router.post('/signup', NewUserRegistrationController)
router.post('/login', LoginController)
router.post('/forgotPassword', RequestForgetPasswordLinkController)
router.post('/resetPassword', ResetUserPasswordController)
router.post('/refresh-token', UserRefreshTokenController)
router.post('/logout', authenticateToken ,LogOutController)

module.exports = router;