require("dotenv").config();
const express = require("express");
const routes = express.Router();
const { campersModel } = require("../models/models");
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const celery = require("celery-node");
const client = celery.createClient(process.env.BROKER_URL, process.env.BROKER_URL)
const { initializeTransaction } = require("../utils/initializeTransaction");


routes.get("/", async (req, res) => {
  campers = await campersModel.find();
  res.json(campers);
});




routes.post("/", cors(), async (req, res) => {
  const {
    fullName,
    email,
    phoneNumber,
    gender,
    archdeaconry,
    parish,
    age,
    camperType,
    denomination,
    paymentOption,
    noOfUnpaidCampersOption,
    noOfCampersToPayFor,
  } = await req.body;



  // ## Data to be registered
  const userData = {
    fullName: fullName,
    email: email,
    phoneNumber: phoneNumber,
    gender: gender,
    age: age,
    camperType: camperType,
    denomination: denomination,
    payment: {
      paymentOption: paymentOption,
    },
  };


  const paymentData = {
    email: email,
    reference: new Date().getTime().toString(),
    callback_url: "http://localhost:5174/payment/successful",
  };

     // PAYMENT PRICE PLAN
  if (paymentOption === "Multiple") {
    payStackData = {
      ...paymentData,
      amount: (5000 * 100) * noOfCampersToPayFor + (5000 * 100),  //So this will also add the person paying with the number of people to payfor
      metadata: {
        custom_fields: [
          {
            display_name: "Name Of Campers Paid For",
            variable_name: noOfUnpaidCampersOption,
          },
        ],
      },
    };
  }
  else{
     payStackData = {...paymentData, amount: 5000 * 100};
  }



//   TRY && CATCH
  try {

    const paymentPortal = await initializeTransaction(payStackData);
    const paymentURL = paymentPortal.data.authorization_url;
    let camper;
    console.log(paymentPortal, paymentURL);

    if (denomination === "Non-Anglican") {
      camper = await new campersModel(userData);
    } else {
      camper = await new campersModel({
        ...userData,
        archdeaconry: archdeaconry,
        parish: parish,
      });
    }


    // ##    Store the User Data in the DB
    await campersModel.create(camper)
      .then(async (d) => {

        // Send This details to the celery worker to send the email
        const task = client.sendTask("tasks.sendRegistrationEmail", [
             {
                  email: d.email,
                  uniqueID: d.uniqueID,
                  fullName: d.fullName,
                  archdeaconry: d.archdeaconry,
                  parish: d.parish,
                  paymentURL: paymentURL,
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
          // Send This details to the celery worker to send the email

        res.status(200).json({ message: "Registration Successful", paymentUrl: paymentURL });
      })
      .catch((err) => {
        throw err;
      });



  } catch (err) {
    const error = errorHandling(err);
    res.status(400).json({ errors: error, message: 'Input Errors' });
  }
//   TRY && CATCH


});

module.exports = routes;
