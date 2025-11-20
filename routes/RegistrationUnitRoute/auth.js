require("dotenv").config();
const express = require("express");
const routes = express.Router();
const bcrypt = require("bcrypt");
const { errorHandling } = require("../../controllers/errorHandler");
const { adminModel } = require("../../models/admin");

routes.post("/login", async (req, res) => {
     const { email, password } = req.body;

     try {
          // Check for null or empty email and password
          if (!email) {
               throw new Error("Email is required.");
          }
          if (!password) {
               throw new Error("Password is required.");
          }

          console.log(email, password);

          const admin = await adminModel.findOne({ email: email });
          if (!admin) {
               throw new Error("Wrong Username or Password");
          }

          const isValidPassword = await bcrypt.compare(password, admin.password);
          if (!isValidPassword) {
               throw new Error("Wrong Username or Password");
          }

          const maxTime = 24 * 60 * 60; // Token expiration time
          const token = generateToken(
               { id: admin._id, fullName: admin.fullName },
               process.env.SECRET_KEY,
               maxTime
          );
          res.status(200).json({ message: "Login Successful", token: token });
     } catch (error) {
          const err = errorHandling(error);
          console.log(err);
          res.status(400).json({ errors: err, message: "Input Errors" });
     }
});

module.exports = routes;
