const express = require("express");
const router = express.Router();
const { upload } = require('../../config/multer')
const { LoginController, UserRefreshTokenController, NewUserRegistrationController, NewUserProfilePictureUpload, RequestForgetPasswordLinkController, ResetUserPasswordController, LogOutController } = require("../../controllers/authenticationController");
const authenticateToken = require('../../middlewares/authentication')

// Authentication Routes
router.post('/signup', NewUserRegistrationController)
router.post('/login', LoginController)
router.post('/forgotPassword', RequestForgetPasswordLinkController)
router.post('/resetPassword', ResetUserPasswordController)
router.post('/refresh-token', UserRefreshTokenController)
router.post('/logout', authenticateToken ,LogOutController)
router.patch('/uploadProfileImage', upload.single('profilePicture'), NewUserProfilePictureUpload)

module.exports = router;