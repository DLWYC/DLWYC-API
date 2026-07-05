const { UserModel } = require('../models/users');
const { EventModel } = require('../models/events');
const logger = require('../config/logger');


const GetUserProfileController = async (req, res) => {
     try {
          const uniqueID = req.user.uniqueId;
          const user = await UserModel.findOne({ uniqueID }).lean()

          const userProfile = {
               uniqueID: uniqueID,
               fullName: user?.fullName,
               email: user?.email,
               profilePicture: user?.profilePicture,
               gender: user?.gender
          }
          console.log(userProfile)
          return res.status(200).json(userProfile);
     }
     catch (error) {
          logger.error(`Get User Profile Controller Error: ${error.message}`);
          return res.status(500).json({ message: "Internal Server Error" });
     }
}


const GetDashboardStatsControllers = async (req, res) => {
     try {
          const latestEvent = await EventModel.find().sort({ eventDate: -1 }).limit(3).lean();
          const [totalEvents] = await Promise.all([
               EventModel.countDocuments({})
          ])
          return res.status(200).json({ totalEvents, latestEvent });
     }
     catch (error) {
          logger.error(`Error fetching Events ${error}`)
          return res.status(500).json({ message: "Error fetching events" });
     }
}



module.exports = { GetUserProfileController, GetDashboardStatsControllers }