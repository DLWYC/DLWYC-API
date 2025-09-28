const express = require('express')
const router = express.Router()
const { userModel } = require('../../models/userModels')
const jwt = require('jsonwebtoken')


router.get('/', async (req, res) => {
     const userDetails = await userModel.findOne({ "email": req.user.email })
     console.log({"userDashBoard Route": userDetails})

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

})



module.exports = router