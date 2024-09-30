const express = require('express')
const routes = express.Router()
const { campersModel } = require('../models/models')
const cors = require('cors')
const { errorHandling } = require('../controllers/errorHandler')
const celery = require('celery-node')
const client = celery.createClient('amqp://', 'amqp://')
const {initializeTransaction} = require('../utils/initializeTransaction')


routes.get('/', async(req,res)=>{
     campers = await campersModel.find()
     res.json(campers)
})

routes.post('/', cors(), async(req, res)=>{
     const { fullName, email, phoneNumber, gender, archdeaconry, parish, age,  camperType, denomination} = await req.body

     const payStackData = {
          email: email,
          amount: 5000 * 100,
          reference: new Date().getTime().toString(),
          callback_url: "http://localhost:5173/payment/successful",
          metadata: {
            custom_fields: [
              {
                display_name: "first_name",
                variable_name: "first_name",
                value: fullName,
              },
              {
                display_name: "PhoneNumber",
                variable_name: "phone",
                value: phoneNumber,
              },
            ],
          },
        };

     const paymentPortal = await initializeTransaction(payStackData)
     const paymentURL = paymentPortal.data.authorization_url

     console.log(paymentURL)
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

          
          await campersModel.create(camper)
          .then(async (d)=>{
               console.log('reg success')
               
          // Send This details to the celery worker to send the email
          const task = client.sendTask('tasks.sendRegistrationEmail', [{email: d.email, uniqueID: d.uniqueID ,fullName: d.fullName, archdeaconry: d.archdeaconry, parish: d.parish, paymentURL: paymentURL}]);
          task.get().then(response=>{
               console.log(`response from Worker ${response}`)
          })
          .catch(err=>{
               console.log(`Error in FE fron Worker ${err}`)
          })
          // Send This details to the celery worker to send the email
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