const { UserModel } = require('../models/users');
const { EventModel } = require('../models/events');
const { MembersCodeModel } = require('../models/membersCode')
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


const GetUsersMembersCodeController = async (req, res) => {
     try {
          const uniqueID = req.user?.uniqueId
          const { eventID } = req.query
          console.log("UNIQUE ID & EVENT ID", uniqueID, eventID)

          if (!uniqueID || !eventID) {
               logger.error(`Missing Credentials to get the codes`)
               return res.status(400).json({ message: "Missing Credentials" })
          }

          const userRecord = await UserModel.findOne({ uniqueID }).select('_id').lean();
          if (!userRecord) {
               return res.status(404).json({ message: "User not found" });
          }


          const membersCodes = await MembersCodeModel.findOne({ payerId: userRecord?._id, eventId: eventID }).select('codes').populate({ path: 'codes.user', select: 'fullName' }).lean()


          return res.status(201).json({ message: "Codes", data: membersCodes || [] })
     }
     catch (error) {
          logger.error(`Error Fetching Codes: ${error}`)
          return res.status(500).json({ message: "Error Fetching Codes", error })
     }
}

const UserProfilePictureUpload = async (req, res) => {
     const { uniqueID } = req.query

     // Check if there is a file uploaded
     try {
          if (!req.file) {
               logger.error(`No Image File Provided`)
               res.status(400).json({ error: "Please Provide An Image" })
          }

          const user = await UserModel.findOne({ uniqueID })
          if (!user) {
               return res.status(404).json({ error: "User Not Found", type: "Upload Error" })
          }

          const folderName = user.archdeaconry ? user.archdeaconry.toLowerCase() : 'general'

          const cloudinaryResponse = await new Promise((resolve, reject) => {
               cloudinary.uploader.upload_stream({
                    folder: `DLWYC_YOUTHS/${folderName}`,
                    public_id: `user_${uniqueID}`,
                    overwrite: true,
                    resource_type: "auto",
                    transformation: [
                         { width: 500, height: 500, crop: "limit" },
                         { quality: 'auto' }
                    ]
               }, (err, result) => (err ? reject(err) : resolve(result))
               ).end(req.file.buffer)
          })


          user.profilePicture = cloudinaryResponse.secure_url,
               user.cloudinaryPublicId = cloudinaryResponse.public_id
          await user.save()
          res.status(201).json({ message: "Image Uploaded Successfully" })
     }
     catch (error) {
          console.log(error)
          logger.error(`Error uploading Picture ${error}`);
          return res.status(500).json({
               error: " Internal Server Error During Upload",
               type: "Upload Error"
          })
     }
}



module.exports = { GetUserProfileController, GetDashboardStatsControllers, GetUsersMembersCodeController, UserProfilePictureUpload }