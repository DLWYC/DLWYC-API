require("dotenv").config();
const express = require("express");
const routes = express.Router();
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const { UserRegisteredEventsModel } = require("../models/userEventsRegistered");

const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);

routes.post("/", async (req, res) => {
  const {reference, userId} = req.body
  console.table({"refernce": reference, "UserId": userId,})
  
  try {
    const {data} = await paystack.transaction.verify(reference)
    console.info("data", data)
    res.status(200).json({message: "Response", data: data})
  }


  catch (err) {
    const error = errorHandling(err);
    console.log(error);
    res.status(400).json({ errors: error });
  }
});





// routes.post("/", cors(), async (req, res) => {
//   const { email, paymentUrl } = req.body;

//   const checkIfUserHasPayedBefore = await UserRegisteredEventsModel.findOne({
//     email: email,
//     "payment.paymentStatus": "success",
//   });

//   if (checkIfUserHasPayedBefore === null) {
//     try {
//       console.log("first" + paymentUrl);

//       res
//         .status(200)
//         .json({ message: "Payment Initialized", paymentUrl: paymentUrl });
//       console.log(`fro payment.js ${paymentUrl}`);
//     } catch (error) {
//       const err = await errorHandling(error);
//       console.log(err);
//       res.status(400).json({ errors: err });
//     }
//   } else {
//     res.status(208).json({ error: "Payed Already" });
//   }
// });

// routes.post("/"(), async (req, res) => {
//   const { email, paymentUrl } = req.body;

//   const checkIfUserHasPayedBefore = await UserRegisteredEventsModel.findOne({
//     email: email,
//     "payment.paymentStatus": "success",
//   });

//   if (checkIfUserHasPayedBefore === null) {
//     try {
//       console.log("first" + paymentUrl);

//       res
//         .status(200)
//         .json({ message: "Payment Initialized", paymentUrl: paymentUrl });
//       console.log(`fro payment.js ${paymentUrl}`);
//     } catch (error) {
//       const err = await errorHandling(error);
//       console.log(err);
//       res.status(400).json({ errors: err });
//     }
//   } else {
//     res.status(208).json({ error: "Payed Already" });
//   }
// });

module.exports = routes;
