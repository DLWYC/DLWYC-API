const express = require('express')
const router = express.Router()
const {campersModel} = require('../models/models')

router.get('/', async(req,res)=>{
     const parish = await req.query.parish
     const campers = await campersModel.find({'parish': parish, 'payment.paymentOption': 'Church Sponsored', 'payment.paymentStatus': 'Not Payed'})

     res.json(campers)
     console.log(campers, parish)
})



module.exports = router