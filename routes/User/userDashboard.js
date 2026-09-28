const express = require('express')
const router = express.Router()
const authenticateToken = require('../../middlewares/authentication')
const { upload } = require('../../config/multer')

const { GetUserProfileController, GetDashboardStatsControllers, UserProfilePictureUpload } = require('../../controllers/userController')



router.get('/profile', authenticateToken, GetUserProfileController);
router.get('/stats', GetDashboardStatsControllers)
router.patch('/uploadProfileImage', upload.single('profilePicture'), UserProfilePictureUpload)



module.exports = router

