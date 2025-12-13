// const express = require('express')
// const router = express.Router()
// const { userModel } = require('../../models/userModels')
// const jwt = require('jsonwebtoken')
// const { errorHandling } = require('../../controllers/errorHandler')


// router.get('/', async (req, res) => {
//      try {

//           const userDetails = await userModel.findOne({ "email": req.user.email })
//           // console.log({"userDashBoard Route": userDetails})
//           if(!userDetails){
//                throw new Error('Nothing')
//           }

//           const userDashboardDetails = {
//                "fullName": userDetails.fullName,
//                "uniqueId": userDetails.uniqueID,
//                "email": userDetails.email,
//                "phoneNumber": userDetails.phoneNumber,
//                "age": userDetails.age,
//                "gender": userDetails.gender,
//                "profilePicture": userDetails.profilePicture,
//                "parish": userDetails.parish,
//                "archdeaconry": userDetails.archdeaconry
//           }

//           res.status(200).json({ data: userDashboardDetails })
//      }
//      catch (err) {
//           const error = errorHandling(err);
//           console.log(error);
//           res.status(400).json({error});
//      }

// })



// module.exports = router

const express = require('express')
const router = express.Router()
const { userModel } = require('../../models/userModels')
const AllocationModel = require('../../models/allocation') // Import your allocation model
const HostelModel = require('../../models/hostel') // Import your hostel/room model
const jwt = require('jsonwebtoken')
const { errorHandling } = require('../../controllers/errorHandler')


router.get('/', async (req, res) => {
     try {
          const userDetails = await userModel.findOne({ "email": req.user.email })
          console.log({ "userDashBoard Route": userDetails?._id })

          if (!userDetails) {
               throw new Error('Nothing')
          }

          // Fetch user's hostel allocation
          const allocation = await AllocationModel.findOne({
               user: userDetails._id
          }).populate('hostel');

          console.log("Hostel Allocaionn:", allocation);

          // Prepare hostel information
          let hostelDetails = null;
          if (allocation && allocation.hostel) {
               hostelDetails = {
                    hostelName: allocation.hostel.name,
                    roomNumber: allocation.hostel.roomNumber,
                    buildingBlock: allocation.hostel.buildingBlock,
                    floor: allocation.hostel.floor,
                    allocationStatus: allocation.status,
               };
          }

          const userDashboardDetails = {
               "fullName": userDetails.fullName,
               "uniqueId": userDetails.uniqueID,
               "email": userDetails.email,
               "phoneNumber": userDetails.phoneNumber,
               "age": userDetails.age,
               "gender": userDetails.gender,
               "profilePicture": userDetails.profilePicture,
               "parish": userDetails.parish,
               "archdeaconry": userDetails.archdeaconry,
               "hostelDetails": hostelDetails
          }

          res.status(200).json({ data: userDashboardDetails })
     }
     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({ error });
     }
})

module.exports = router