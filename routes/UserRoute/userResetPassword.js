require("dotenv").config();
const express = require("express");
const route = express.Router();
const jwt = require("jsonwebtoken");
const { errorHandling } = require('../../controllers/errorHandler');
const { userModel } = require("../../models/userModels");
const bcrypt = require("bcrypt");

// This is where the password will be UPDATED
route.patch("/:id/:token", async (req, res) => {
     const { id, token } = req.params;
     const { password, confirmPassword } = req.body;

     try {

          const user = await userModel.findOne({ _id: id })

          if (!user) {
               throw Error("Sorry This Student Doesn't Exist");
          } else {
               const secret_key =
                    process.env.JWT_SECRET_KEY + user.password;
               const verifiedStudent = jwt.verify(token, secret_key);

               //  If the token is verified and the passwords sent to
               if (verifiedStudent) {
                    if (password == "") {
                         throw Error("Please Enter Your Password");
                    } else if (confirmPassword == "") {
                         throw Error("Please Confirm Your Password");
                    } else if (password !== confirmPassword) {
                         throw Error("The Passwords do not match");
                    }
                    const saltRounds = 12;
                    const salt = await bcrypt.genSalt(saltRounds);
                    const newHashedPassword = await bcrypt.hash(password, salt);
                    const query = {
                         "password": newHashedPassword,
                    };

                    const status = await user.updateOne(query)
                    if (status.acknowledged == true) {
                         res.status(200).json({ message: "Password Updated Successfully" });
                    }
               }
          }
     }

     catch (err) {
          const error = errorHandling(err);
          console.log(error);
          res.status(400).json({ errors: error });
     };
});

module.exports = route;