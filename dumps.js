/ #:::::::::::::::: UPDATE USER PROFILE PICTURE ::::::::::::
routes.patch("/:userId/profile-picture", async (req, res) => {
  const { profilePicture } = req.body;
  
  try {
    const user = await userModel.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete old image if exists
    if (user.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(user.cloudinaryPublicId);
    }

    // Upload new image
    if (profilePicture) {
      const uploadResponse = await cloudinary.uploader.upload(profilePicture, {
        folder: "user_profiles",
        resource_type: "auto",
        transformation: [
          { width: 500, height: 500, crop: "limit" },
          { quality: "auto" }
        ]
      });
      
      user.profilePicture = uploadResponse.secure_url;
      user.cloudinaryPublicId = uploadResponse.public_id;
      await user.save();
    }

    res.status(200).json({ 
      message: "Profile picture updated successfully",
      profilePicture: user.profilePicture
    });
  } catch (err) {
    const error = errorHandling(err);
    res.status(400).json({ error: error });
  }
});

// #:::::::::::::::: DELETE USER PROFILE PICTURE ::::::::::::
routes.delete("/:userId/profile-picture", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(user.cloudinaryPublicId);
      user.profilePicture = null;
      user.cloudinaryPublicId = null;
      await user.save();
    }

    res.status(200).json({ message: "Profile picture deleted successfully" });
  } catch (err) {
    const error = errorHandling(err);
    res.status(400).json({ error: error });
  }
});


















import { createContext, useContext, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
const AuthContext = createContext();

export function AuthProvider({ children }) {
  const baseUrl = import.meta.env.VITE_BASE_URL;
  const [student, setStudent] = useState(null);


  // ***************************  AUTH LOGIN && LOGOUT  *********************************

  // ::::::::: Login Function :::::::::
  const loginMutation = useMutation({
    mutationFn: async (userData) => {
      const { values } = userData;
      // console.log(userData);
      const res = await axios.post(`${baseUrl}/api/login`, values);
      console.log(res, "Login Message");
      return res;
    },
    onSuccess: async (data) => {
      // Get user token and store token in local storage student data
      const { token } = data.data;
      localStorage.setItem("token", token);
      const studentData = await getStudentData(token);
      // Get user token
      setStudent(studentData);
      console.success("Login Successful! 🎉 ");
    },
    onError: (error) => {
      // console.log("This is the error from the Login API Route: ", error);
      console.error(error.response?.data?.loginError || "Login Failed! 🤕 ");
    },
  });

  // ::::::::: Logout Function :::::::::
  const logOut = () => {
    setStudent(null);
    localStorage.setItem("StudentCurrentPosition", "");
    localStorage.setItem("inGeofence", "");
    localStorage.setItem("token", "");
    console.info("LogOut Successful");
  };


  

  return (
    <AuthContext.Provider
      value={{
        login: loginMutation.mutateAsync,
        
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
const mongoose = require("mongoose");










































const {
     isEmail,
     isAlpha,
     isMobilePhone,
     isAlphanumeric,
} = require("validator");
const { v4: uuid4 } = require("uuid");
const bcrypt = require('bcrypt')
const { generateUniqueId } = require("../controllers/UniqueNumberGen");

//# Registration Schema & Model
const UserSchema = new mongoose.Schema(
     {
          uniqueID: {
               type: String,
               // default: uuid4(),
          },
          fullName: {
               type: String,
               required: [true, "Please Enter Your Full Name"],
          },
          email: {
               type: String,
               required: [true, "Please Enter Your Email"],
               lowercase: true,
               validate: [isEmail, "Please Enter A Valid Email"],
          },
          password: {
               type: String,
               required: [true, "Please Enter Your Password"],
          },
          phoneNumber: {
               type: String,
               required: [true, "Please Enter Your Phone Number"],
               validate: [isMobilePhone, "Please Enter A Valid Phone Number"],
          },
          age: {
               type: String,
               required: [true, "Please Enter Your Age"],
          },
          gender: {
               type: String,
               enum: ["Male", "Female"],
               required: [true, "Please Select A Gender"],
          },
          archdeaconry: {
               type: String,
               enum: [
                    "Abule Egba",
                    "Agege",
                    "Amuwo Odofin",
                    "Bariga",
                    "Cathedral",
                    "Egbe",
                    "Festac",
                    "Gowon Estate",
                    "Iba",
                    "Idimu",
                    "Ijede",
                    "Iju-Ishaga",
                    "Ikeja",
                    "Ikorodu",
                    "Ikorodu-North",
                    "Ikosi-Ketu",
                    "Ikotun",
                    "Imota",
                    "Ipaja",
                    "Isolo",
                    "Ogudu",
                    "Ojo",
                    "Ojo-Alaba",
                    "Ojodu",
                    "Opebi",
                    "Oshodi",
                    "Oto-Awori",
                    "Owutu",
                    "Satellite",
                    "Somolu",
               ],
               // required: [true, 'Please Select An Archdeaconry'],
          },
          parish: {
               type: String,
               // required: [true, 'Please Select A Parish'],
          },
          camperType: {
               type: String,
               enum: ["First Timer", "Regular Timer"],
               required: [true, "Please Select An Option"],
          },
          denomination: {
               type: String,
               enum: ["Anglican", "Non-Anglican"],
               required: [true, "Please Select An Option"],
          },
          rulesAndRegulations: {
               type: Boolean,
               default: true,
          },
          payment: {
               paymentOption: {
                    type: String
               },
               paymentID: {
                    type: Number,
                    default: null
               },
               paymentStatus: {
                    type: String,
                    default: 'Not Payed'
               },
               reference: {
                    type: String,
                    default: null
               },
               modeOfPayment: {
                    type: String,
                    default: null
               },
               paymentTime: {
                    type: String,
               },
          },
          checkStatus: {
               type: Boolean,
               default: false
          },
          allocatedRoom: {
               type: String
          }
     },
     { timestamps: true }
);

UserSchema.pre("save", function (next) {
     this.uniqueID = generateUniqueId(this.archdeaconry);
     if (this.denomination === "Non-Anglican") {
          this.archdeaconry = null;
          this.parish = null;
          this.payment.paymentOption = "Single"
     }
     next();
});



// Admin
const AdminSchema = new mongoose.Schema(
     {
          fullName: {
               type: String,
               required: [true, "Please Enter Your Full Name"],
               lowercase: true,
          },
          email: {
               type: String,
               required: [true, "Please Enter Your Email"],
               lowercase: true,
               validate: [isEmail, "Please Enter A Valid Email"],
          },
          password: {
               type: String,
               required: [true, "Please Enter Your Password"],
          },
     },
     { timestamps: true }
);

AdminSchema.pre('save', async function (next) {
     const saltRounds = await bcrypt.genSalt()
     this.password = await bcrypt.hash(this.password, saltRounds)
     next()
})

const userModel = new mongoose.model("camper", UserSchema);
const adminModel = new mongoose.model("admin", AdminSchema);
module.exports = { userModel, adminModel };















require("dotenv").config();
const express = require("express");
const routes = express.Router();
const { campersModel } = require("../models/models");
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const celery = require("celery-node");
const client = celery.createClient(process.env.BROKER_URL, process.env.BROKER_URL)
const { initializeTransaction } = require("../utils/initializeTransaction");
const {allocateHostels} = require("../controllers/roomAllocation")


routes.get("/", async (req, res) => {
  campers = await campersModel.find();
  res.json(campers);
});




routes.post("/", cors(), async (req, res) => {
  const { fullName, email, phoneNumber, gender, archdeaconry, parish, age, camperType, denomination, paymentOption, noOfUnpaidCampersOption, noOfCampersToPayFor,
  } = await req.body;
  const allocatedRoom = allocateHostels(fullName, age, gender)
  console.log(allocatedRoom)


  // ## Data to be registered
  const userData = { fullName: fullName, email: email, phoneNumber: phoneNumber, gender: gender, age: age, camperType: camperType, denomination: denomination,
  };



//   TRY && CATCH
  try {

    //  ########## Collation of user Info
    if (denomination === "Non-Anglican") {
      camper = await new campersModel({...userData, allocatedRoom: allocatedRoom.data.room});
    } else {
      camper = await new campersModel({
        ...userData,
        archdeaconry: archdeaconry,
        parish: parish,
        allocatedRoom: allocatedRoom.data.room
      });
    }
    //  ########## Collation of user Info


    // ########### Store the User Data in the DB
      await campersModel.create(camper)
        .then(async (d) => {
  
          // // Send This details to the celery worker to send the email
          const task = client.sendTask("tasks.sendRegistrationEmail", [
               {
                    email: d.email,
                    uniqueID: d.uniqueID,
                    fullName: d.fullName,
                    archdeaconry: d.archdeaconry,
                    parish: d.parish,
                    hostel: allocatedRoom.data.room
                 },
            ]);
            task
            .get()
            .then((response) => {
                 console.log(`response from Worker ${response}`);
            })
            .catch((err) => {
                 console.log(`Error in FE fron Worker ${err}`);
            });
            // console.log(`This is the Task ${task}`)
          //   // Send This details to the celery worker to send the email
  
          // res.status(200).json({ message: "Registration Successful", paymentUrl: paymentURL });
          res.status(200).json({ message: "Registration Successful" });
        })
        .catch((err) => {
          throw err;
        });



  } catch (err) {
    const error = errorHandling(err);
    console.log(error)
    res.status(400).json({ errors: error, message: 'Input Errors' });
  }
//   TRY && CATCH


});

module.exports = routes;
