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
    profilePicture: {
      type: String,
      default: null
    },
    cloudinaryPublicId: {
      type: String,
      default: null
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
      required: [true, ' Please Select Your Archdeaconry']
    },
    parish: {
      type: String,
      required: [true, 'Please Select Your Parish']
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  const saltRounds = await bcrypt.genSalt()
  this.password = await bcrypt.hash(this.password, saltRounds)
  this.uniqueID = generateUniqueId(this.archdeaconry);
  next();
});



const userModel = new mongoose.model("user", UserSchema);
module.exports = { userModel };
