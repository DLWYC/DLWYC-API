require("dotenv").config();
const express = require("express");
const routes = express.Router();
const { userModel } = require("../../models/userModels");
const { errorHandling } = require("../../controllers/errorHandler");
const celery = require("celery-node");


// #:::::::::::::::: GET ALL REGISTERED USERS : ::::::::::::;;;
routes.get("/", async (req, res) => {
  campers = await userModel.find();
  res.json(campers);
});



// #:::::::::::::::: REGISTERE USERS :::::::::::::
routes.post("/", async (req, res) => {
  const {
    fullName,
    email,
    phoneNumber,
    gender,
    archdeaconry,
    parish,
    age,
    password
  } = await req.body;

  try {
    // Check if this user has registered before
    const registeredBefore = await userModel.findOne({ "email": email, "fullName": fullName })
    console.log("Has User Registered Before:", registeredBefore ? true : false)

    if (registeredBefore) {
      throw new Error("Sorry This User Has Registered Before")
    }

    else {


      const userData = await new userModel({
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        gender: gender,
        age: age,
        password: password,
        archdeaconry: archdeaconry,
        parish: parish,
      });


      await userModel.create(userData)
        .then(async (response) => {
          res.status(200).json({ message: "Registration Successful", userName: response.fullName });
        })
        .catch((err) => {
          throw err;
        });
    }

  } catch (err) {
    const error = errorHandling(err);
    console.error("Error From Registration Route: ", error)
    res.status(400).json({ error: error, type: 'Registration Error' });
  }


});

module.exports = routes;
