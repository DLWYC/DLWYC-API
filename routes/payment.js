require("dotenv").config();
const express = require("express");
const routes = express.Router();
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const { campersModel } = require("../models/models");
const celery = require("celery-node");
const client = celery.createClient(
  process.env.BROKER_URL,
  process.env.BROKER_URL
);
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);



routes.get("/:reference", cors(), async (req, res) => {
  let data;
  let campers;

  const reference = req.params.reference;
  try {
    await paystack.transaction
      .verify(reference)
      .then(async (response) => {
        const paymentMode = await response.data.channel;
        const paymentStatus = await response.data.status;
        const paymentTime = await response.data.paid_at;
        const email = await response.data.customer.email;

        if (await response.data.metadata) {
          campers = await response.data.metadata.custom_fields[0].variable_name;
        }

        if (response.data.status === "success") {
          // If it is a single picked eg. No Other Campers
          if (!campers) {
            data = await campersModel.findOneAndUpdate(
              { email: email },
              {
                $set: {
                  "payment.modeOfPayment": paymentMode,
                  "payment.reference": reference,
                  "payment.paymentStatus": paymentStatus,
                  "payment.paymentTime": paymentTime,
                },
              },
              { new: true, upsert: false }
            );
          } 
          // If there is meta data
          else {
            campers.forEach(async (camper) => {
              data = await campersModel.updateMany(
                { uniqueID: camper.value },
                {
                  $set: {
                    "payment.modeOfPayment": paymentMode,
                    "payment.reference": reference,
                    "payment.paymentStatus": paymentStatus,
                    "payment.paymentTime": paymentTime,
                  },
                },
                { new: true, upsert: false }
              );
            });
          }

          // Send This details to the celery worker to send the email
          const task = client.sendTask("tasks.sendPaymentEmail", [
            {
              email: data.email,
              uniqueID: data.uniqueID,
              fullName: data.fullName,
            },
          ]);
          task
            .get()
            .then((response) => {
              console.log(`response from Worker ${response}`);
            })
            .catch((err) => {
              throw err;
            });
          // Send This details to the celery worker to send the email
          res.status(200).json(response);
        } else {
          throw "Error Sending email";
        }
      })
      .catch((err) => {
        throw err;
      });
  } catch (err) {
    const error = errorHandling(err);
    console.log(error);
    res.status(400).json({ errors: error });
  }
});

routes.post("/", cors(), async (req, res) => {
  const { email, paymentUrl } = req.body;

  const checkIfUserHasPayedBefore = await campersModel.findOne({
    email: email,
    "payment.paymentStatus": "success",
  });

  if (checkIfUserHasPayedBefore === null) {
    try {
      console.log("first" + paymentUrl);

      res
        .status(200)
        .json({ message: "Payment Initialized", paymentUrl: paymentUrl });
      console.log(`fro payment.js ${paymentUrl}`);
    } catch (error) {
      const err = await errorHandling(error);
      console.log(err);
      res.status(400).json({ errors: err });
    }
  } else {
    res.status(208).json({ error: "Payed Already" });
  }
});

module.exports = routes;
