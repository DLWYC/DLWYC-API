const mongoose = require('mongoose')
const { isEmail, isAlpha, isMobilePhone, isAlphanumeric } = require('validator')
const { v4: uuid4 } = require('uuid')

//# Registration Schema & Model
const campRegistrationSchema = new mongoose.Schema({
     uniqueID:{
          type: "String",
          default: uuid4()
     },
     fullName: {
          type: "String",
          required: [true, 'Please Enter Your Full Name'],
          lowercase: true,
     },
     email: {
          type: "String",
          required: [true, "Please Enter Your Email"],
          unique: true,
          validate: [isEmail, 'Please Enter A Valid Email']
     },
     phoneNumber: {
          type: "String",
          required: [true, 'Please Enter Your Phone Number'],
          validate: [isMobilePhone, 'Please Enter A Valid Phone Number']
     },
     age: {
          type: "String",
          required: [true, 'Please Enter Your Age'],
     },
     gender: {
          type: "String",
          enum: ['Male', 'Female'],
          required: [true, 'Please Select A Gender'],
     },
     archdeaconry: {
          type: "String",
          enum: ['Abule Egba', 'Agege', 'Amuwo Odofin', 'Bariga', 'Festac', 'Gowon Estate', 'Iba', 'Idimu', 'Ijede', 'Iju-Ishaga', 'Ikeja', 'Ikorodu', 'Ikorodu-North', 'Ikosi-Ketu', 'Imota', 'Ipaja', 'Isolo', 'Ogudu', 'Ojo', 'Ojo-Alaba', 'Ojodu', 'Opebi', 'Oshodi', 'Oto-Awori', 'Owutu', 'Satallite', 'Somolu'],
          required: [true, 'Please Select An Archdeaconry'],
     },
     parish: {
          type: "String",
          required: [true, 'Please Select A Parish'],
     },
     // price: {
     //      type: 'String',
     //      required: [true, 'Please Enter Your Price']
     // }
}, {timestamps: true})




const campersModel = new mongoose.model('camper', campRegistrationSchema)


module.exports = { campersModel }