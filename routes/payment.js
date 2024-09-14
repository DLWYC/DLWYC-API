const express = require("express")
const routes = express.Router()
const cors = require('cors')
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY)
const { errorHandling } = require('../controllers/errorHandler')
const { campersModel } = require('../models/models')



routes.get('/:reference', cors(), async(req,res)=>{
     const reference = req.params.reference
     console.log(req.body)
     try{
          await paystack.transaction.verify(reference)
               .then(response=>{
                    console.log(response.data)

                    if (response.data.status === 'success'){
                         res.status(200).json(response)
                    }
                    else{
                         throw Error('/gallery')
                    }

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


routes.post('/', cors(), async(req,res)=>{
     const {fullName, email, denomination}  = req.body
     const payStackData = {
          name: fullName,
          email: email,
          amount: 1000 * 100,
          reference: (new Date()).getTime().toString(),
          callback_url: 'http://localhost:5173/registration/verify',
          metaData: {
               denomination: denomination,
               description: 'Donation for the Church of Light',
          }
     }
     try {
          await paystack.transaction.initialize(payStackData)
          .then(response=>{
               // console.log(`sdfdsf ${response.data.reference}`)
               res.status(200).json(response)
          })
          .catch(err=>{
               throw (err)
          })
     }
     catch(error){
          const err = await errorHandling(error)
          console.log(err)
          res.status(400).json({"errors": err})
     }

})



module.exports = routes