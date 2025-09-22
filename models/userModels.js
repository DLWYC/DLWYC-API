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
    },
    parish: {
      type: String,
    },
    camperType: {
      type: String,
      enum: ["First Timer", "Regular Timer"],
      // required: [true, "Please Select An Option"],
    },
    denomination: {
      type: String,
      enum: ["Anglican", "Non-Anglican"],
      // required: [true, "Please Select An Option"],
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

UserSchema.pre("save", async function (next) {
  const saltRounds = await bcrypt.genSalt()
  this.password = await bcrypt.hash(this.password, saltRounds)
  this.uniqueID = generateUniqueId(this.archdeaconry);
  next();
});



const userModel = new mongoose.model("camper", UserSchema);
module.exports = { userModel };
