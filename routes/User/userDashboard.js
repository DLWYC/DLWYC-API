const express = require('express')
const router = express.Router()
const authenticateToken = require('../../middlewares/authentication')
const { upload } = require('../../config/multer')

const { GetUserProfileController, GetDashboardStatsControllers, UserProfilePictureUpload, UserUpdateProfile } = require('../../controllers/userController')



router.get('/profile', authenticateToken, GetUserProfileController);
router.get('/stats', GetDashboardStatsControllers)
router.patch('/profile/update', authenticateToken, UserUpdateProfile)
router.patch('/uploadProfileImage', authenticateToken, upload.single('file'), UserProfilePictureUpload)



module.exports = router

