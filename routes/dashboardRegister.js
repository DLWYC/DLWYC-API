require("dotenv").config();
const express = require("express");
const routes = express.Router();
const bcrypt = require('bcrypt')
const { errorHandling } = require('../controllers/errorHandler')
const { generateToken } = require('../utils/generateToken')
const {adminModel} = require('../models/models')



routes.post("/", async (req,res) =>{
     try{
          const {fullName ,email, password} = await req.body
          const user = new adminModel({
                    fullName: fullName,
                    email: email,
                    password: password
               })

               await adminModel.create(user)
               .then(data=>{
                    res.json({'message': "Registration Successful"})
                    console.log(data)
               })
               .catch(err=>{
                    console.log(err)
                    throw (err)
               })
     }
     catch(error){
          const err = errorHandling(error)
          res.status(400).json({'error': err})
     }
})


module.exports = routes