const express = require('express')
const routes = express.Router()
const { campersModel } = require('../models/models')
const cors = require('cors')
const { errorHandling } = require('../controllers/errorHandler')
const celery = require('celery-node')
const client = celery.createClient('amqp://', 'amqp://')
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY)


routes.get('/', async(req,res)=>{
     campers = await campersModel.find()
     res.json(campers)
})

routes.post('/', cors(), async(req, res)=>{
     const { fullName, email, phoneNumber, gender, archdeaconry, parish, age,  camperType, denomination} = await req.body

     const payStackData = {
          name: fullName,
          email: email,
          amount: 1000 * 100,
          reference: (new Date()).getTime().toString(),
          callback_url: 'http://localhost:5173/registration/success',
          metaData: {
               denomination: denomination,
               description: 'Donation for the Church of Light',
          }
     }
     

     try{
          const camper = await new campersModel({
               fullName: fullName,
               email: email,
               phoneNumber: phoneNumber,
               gender: gender,
               age: age,
               archdeaconry: archdeaconry,
               parish: parish,
               camperType: camperType,
               denomination: denomination,                
          })

          
          // await campersModel.create(camper)
          // .then(async (d)=>{
               
          //      // Paystack Transaction Initialization
          //      await paystack.transaction.initialize(payStackData)
          //      .then(response=>{
          //           res.status(200).json(response)
          //      })
          //      .catch(err=>{
          //           throw (err)
          //      })
          //      // Paystack Transaction Initialization


          //      // res.status(200).json({'data': d, 'message': 'Registration Successful'})



          //      // Send This details to the celery worker to send the email
          //      // const task = client.sendTask('tasks.sendEmail', [{email: d.email, uniqueID: d.uniqueID  ,fullName: d.fullName, archdeaconry: d.archdeaconry, parish: d.parish}]);
          //      // task.get().then(response=>{
          //      //      console.log(`response from Worker ${response}`)
          //      // })
          //      // .catch(err=>{
          //      //      console.log(`Error in FE fron Worker ${err}`)
          //      // })
          //      // Send This details to the celery worker to send the email

          // })
          // .catch(err=>{
          //      throw (err)
          // })

          
     }
     catch(err){
          const error = errorHandling(err)
          res.status(400).json({"errors": error})
     }
})


module.exports = routes