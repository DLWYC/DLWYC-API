const express = require("express");
const router = express.Router();
const { upload } = require('../../config/multer')
const { LoginController, UserRefreshTokenController, NewUserRegistrationController, NewUserProfilePictureUpload, RequestForgetPasswordLinkController, ResetUserPasswordController } = require("../../controllers/authenticationController");

// Authentication Routes
router.post('/signup', NewUserRegistrationController)
router.post('/login', LoginController)
router.post('/forgotPassword', RequestForgetPasswordLinkController)
router.post('/resetPassword', ResetUserPasswordController)
router.post('/refresh-token', UserRefreshTokenController)
router.patch('/uploadProfileImage', upload.single('profilePicture'), NewUserProfilePictureUpload)

module.exports = router;