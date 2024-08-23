const express = require('express')
const routes = express.Router()
const { campersModel } = require('../models/models')
const cors = require('cors')
const { errorHandling } = require('../controllers/errorHandler')

routes.get('/', async(req,res)=>{
     campers = await campersModel.find()
     res.json(campers)
})

routes.post('/', cors(), async(req, res)=>{
     const { fullName, email, phoneNumber, gender, archdeaconry, parish, age, transactionID } = await req.body

     try{
          const camper = await new campersModel({
               fullName: fullName,
               email: email,
               phoneNumber: phoneNumber,
               gender: gender,
               archdeaconry: archdeaconry,
               parish: parish,
               age: age,
               transactionID: transactionID
          })

          await campersModel.create(camper)
          .then(d=>{
               res.status(200).json({'message': 'Registration Successful'})
          })
          .catch(err=>{
               throw (err)
          })
          
     }
     catch(err){
          const error = errorHandling(err)
          res.status(400).json({"errors": error})
     }
})


module.exports = routes