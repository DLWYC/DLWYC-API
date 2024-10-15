const express = require("express");
const routes = express.Router();
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const { campersModel } = require("../models/models");
const axios = require("axios");
const celery = require('celery-node')
const client = celery.createClient('amqp://', 'amqp://')
const {initializeTransaction} = require('../utils/initializeTransaction')
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);



routes.get("/:reference", cors(), async (req, res) => {
  const reference = req.params.reference;
  try {
    await paystack.transaction
      .verify(reference)
      .then(async (response) => {
        const paymentMode = await response.data.channel;
        const paymentStatus = await response.data.status;
        const paymentTime = await response.data.paid_at;
        const email = await response.data.customer.email;
          //  console.log(email, paymentMode, paymentStatus, paymentTime); 

        if (response.data.status === "success") {
        const d =  await campersModel.findOneAndUpdate(
            { "email": email },
            {
              $set: {
                "payment.modeOfPayment": paymentMode,
                "payment.reference": reference,
                "payment.paymentStatus": paymentStatus,
                "payment.paymentTime": paymentTime,
              },
            },
            {new: true, upsert: false}
          );

          // Send This details to the celery worker to send the email
          const task = client.sendTask('tasks.sendPaymentEmail', [{email: d.email, uniqueID: d.uniqueID  ,fullName: d.fullName}]);
          task.get().then(response=>{
               console.log(`response from Worker ${response}`)
          })
          .catch(err=>{
               throw err
          })
          // Send This details to the celery worker to send the email
          res.status(200).json(response);
        } else {
          throw ("Error Sending email");
        }
      })
      .catch((err) => {
        throw err;
      });
  } catch (err) {
    const error = errorHandling(err);
    console.log(error)
    res.status(400).json({ errors: error });
  }
});




routes.post("/", cors(), async (req, res) => {
  
  const {email, paymentUrl} = req.body

  const checkIfUserHasPayedBefore = await campersModel.findOne({"email": email, "payment.paymentStatus": "success"})
  
  if(checkIfUserHasPayedBefore === null){
      try {
      console.log("first" + paymentUrl)
        
        res.status(200).json({message: "Payment Initialized", paymentUrl: paymentUrl})
        console.log(`fro payment.js ${paymentUrl}`)
      } catch (error) {
        const err = await errorHandling(error);
        console.log(err);
        res.status(400).json({ errors: err });
      }
    }
    else{
      res.status(208).json({ error: "Payed Already" })
    }


});

module.exports = routes;
