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
const campRegistrationSchema = new mongoose.Schema(
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
    // allocatedRoom: {
    //   type: String
    // }
  },
  { timestamps: true }
);

campRegistrationSchema.pre("save", function (next) {
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

AdminSchema.pre('save', async function(next){
     const saltRounds = await bcrypt.genSalt()
     this.password = await bcrypt.hash(this.password, saltRounds)
     next()
})

const campersModel = new mongoose.model("camper", campRegistrationSchema);
const adminModel = new mongoose.model("admin", AdminSchema);
module.exports = { campersModel, adminModel };
