const mongoose = require("mongoose");
const { isEmail, isMobilePhone } = require("validator");
const bcrypt = require('bcrypt')
const config = require('../config/index')
const jwt = require('jsonwebtoken')
const logger = require('../config/logger')
const { generateUniqueId } = require('../utils/uniqueIdGenerator')

//# Registration Schema & Model
const UserSchema = new mongoose.Schema(
     {
          uniqueID: {
               type: String,
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
               select: false
          },
          phoneNumber: {
               type: String,
               required: [true, "Please Enter Your Phone Number"],
               validate: [isMobilePhone, "Please Enter A Valid Phone Number"],
          },
          profilePicture: {
               type: String,
               default: null
          },
          cloudinaryPublicId: {
               type: String,
               default: null
          },
          membershipType: {
               type: String,
               required: [true, "Indicate Your Membership Type"],
               enum: ['member', 'guest']
          },
          age: {
               type: String,
               required: [true, "Please Enter Your Age"],
          },
          levelOfEducation: {
               type: String,
          },
          roleInParish: {
               type: String,
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
                    ""
               ],
               //required: [true, ' Please Select Your Archdeaconry']
          },
          parish: {
               type: String,
               //required: [true, 'Please Select Your Parish']
          },
     },
     { timestamps: true }
);


UserSchema.index({ uniqueID: 1, fullName: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ membershipType: 1 })

// UserSchema.pre('save', async function (next) {
//      if (this.isNew && !this.uniqueID) {
//           try {
//                this.uniqueID = generateUniqueId(this.archdeaconry)
//           }
//           catch (error) {
//                logger.error("Generating Unique ID Failed")

//           }
//      }
//      if (!this.isModified('password')) {
//           console.log("Newpassword", this.password)
//           return ;
//      }
//      try {
//           this.password = await bcrypt.hash(this.password, 10)
//      }
//      catch (error) {
//           console.log(error)
//           logger.error(`Bcrypt Pre-Save Hook Error: ${error.message}`)
//           return error
//      }
// });

UserSchema.pre('save', async function (next) {
     if (this.isNew && !this.uniqueID) {
          try {
               this.uniqueID = generateUniqueId(this.archdeaconry);
          } catch (error) {
               logger.error(`Generating Unique ID Failed: ${error.message}`);
          }
     }

     // 2. Skip password hashing if it hasn't changed
     if (!this.isModified('password')) {
          return ;
     }

     // 3. Hash the new or modified password
     try {
          this.password = await bcrypt.hash(this.password, 10);
     } catch (error) {
          console.log("Error", error)
          logger.error(`Bcrypt Pre-Save Hook Error: ${error.message}`);
          throw error; 
     }
});


UserSchema.methods.comparePassword = async function (candidatePassword) {
     if (!this.password) {
          throw new Error("No Active Password Found For This User")
     }

     try {
          return await bcrypt.compare(candidatePassword, this.password)
     }
     catch (error) {
          console.log("Error Comparing password")
          throw error
     }
}




const UserModel = new mongoose.model("user", UserSchema);
module.exports = { UserModel };
