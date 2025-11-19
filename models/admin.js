const mongoose = require("mongoose");
const bcrypt = require('bcrypt')
const { isEmail } = require("validator");

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

const adminModel = new mongoose.model("admin", AdminSchema);
module.exports = { adminModel };