
require("dotenv").config();
const express = require("express");
const routes = express.Router();
const { userModel } = require("../../models/userModels");
const { errorHandling } = require("../../controllers/errorHandler");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


// #:::::::::::::::: GET ALL REGISTERED USERS : ::::::::::::;;;
routes.get("/", async (req, res) => {
  campers = await userModel.find();
  res.json(campers);
});



// #:::::::::::::::: REGISTERE USERS :::::::::::::
routes.post("/", async (req, res) => {

  let profilePictureUrl = null;
  let cloudinaryPublicId = null;

  const {
    fullName,
    email,
    phoneNumber,
    gender,
    archdeaconry,
    parish,
    age,
    password,
    profilePicture
  } = await req.body;

  try {
    // Check if this user has registered before
    const registeredBefore = await userModel.findOne({ "email": email })
    console.log("Has User Registered Before:", registeredBefore ? true : false)

    if (registeredBefore) {
      throw new Error("Sorry This User Has Registered Before")
    }

    if (profilePicture) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
          folder: "DLWYC_YOUTHS",
          resource_type: "auto",
          transformation: [
            { width: 500, height: 500, crop: "limit" },
            { quality: "auto" }
          ]
        });

        profilePictureUrl = uploadResponse.secure_url;
        cloudinaryPublicId = uploadResponse.public_id;

        console.log("Image uploaded successfully:", profilePictureUrl);
      } catch (uploadErr) {
        console.error("Cloudinary upload error:", uploadErr);
        throw new Error("Failed to upload profile picture. Please try again.");
      }
    }

    const userData = await new userModel({
      fullName: fullName,
      email: email,
      phoneNumber: phoneNumber,
      gender: gender,
      age: age,
      password: password,
      archdeaconry: archdeaconry,
      parish: parish,
      profilePicture: cloudinaryPublicId == null ? null : profilePictureUrl,
      cloudinaryPublicId: cloudinaryPublicId
    });


    const response = await userModel.create(userData);
    res.status(200).json({
      message: "Registration Successful",
      userName: response.fullName,
      profilePicture: response.profilePicture
    });

  } catch (err) {
    // Clean up uploaded image on error
    if (req.file) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupErr) {
        console.error("Error cleaning up image:", cleanupErr);
      }
    }

    const error = errorHandling(err);
    console.error("Error From Registration Route: ", error);
    res.status(400).json({ error: error, type: "Registration Error" });
  }


});

module.exports = routes;
