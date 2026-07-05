const express = require('express')
const router = express.Router()
const authenticateToken = require('../../middlewares/authentication')
const { GetUserProfileController, GetDashboardStatsControllers } = require('../../controllers/userController')



router.get('/profile', authenticateToken, GetUserProfileController);
router.get('/stats', GetDashboardStatsControllers)


module.exports = router

