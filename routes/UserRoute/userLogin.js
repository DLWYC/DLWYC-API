require("dotenv").config();
const express = require("express");
const routes = express.Router();
const bcrypt = require("bcrypt");
const { errorHandling } = require("../../controllers/errorHandler");
const { generateToken } = require("../../utils/generateToken");
const { userModel } = require("../../models/userModels");

routes.post("/", async (req, res) => {
     const { email, password } = req.body;

     try {

          if (!email || email == "") {
               throw new Error ("Please Enter Your Email");
          }
          if (!password || password == "") {
               throw new Error ("Please Enter Your Password");
          }
          const user = await userModel.findOne({ email: email });
          if (!user) {
               throw new Error("Wrong Username or Password");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
               throw new Error("Wrong Username or Password");
          }

          const maxTime = 2 * 60 * 60; // Token expiration time
          const token = generateToken(
               { id: user._id, email: user.email, uniqueID: user.uniqueID },
               process.env.SECRET_KEY,
               maxTime
          );
          console.log("Login Successful")
          res.status(200).json({ message: "Login Successful", token: token });
     } catch (error) {
          const err = errorHandling(error);
          console.error(err);
          res.status(400).json({ errors: err, message: "User Login Error" });
     }
});

module.exports = routes;
