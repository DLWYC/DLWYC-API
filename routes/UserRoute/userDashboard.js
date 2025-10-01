const express = require('express')
const router = express.Router()
const { userModel } = require('../../models/userModels')
const jwt = require('jsonwebtoken')
const { errorHandling } = require('../../controllers/errorHandler')


router.get('/', async (req, res) => {
     try {

          const userDetails = await userModel.findOne({ "email": req.user.email })
          // console.log({"userDashBoard Route": userDetails})
          if(!userDetails){
               throw new Error('Nothing')
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
               "archdeaconry": userDetails.archdeaconry
          }

          res.status(200).json({ data: userDashboardDetails })
     }
     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({error});
     }

})



module.exports = router