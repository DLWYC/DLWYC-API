require("dotenv").config();
const express = require("express");
const routes = express.Router();
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const { paymentCodeModel } = require("../models/paymentCodes");

const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);


// Verify Payment
routes.post("/verify-payment", async (req, res) => {
  const { reference, userId } = req.body
  console.table({ "refernce": reference, "UserId": userId, })

  try {
    const { data } = await paystack.transaction.verify(reference)
    console.info("data", data)
    res.status(200).json({ message: "Response", data: data })
  }


  catch (err) {
    const error = errorHandling(err);
    console.log(error);
    res.status(400).json({ errors: error });
  }
});



routes.post('/verify-code', async (req, res) => {
  const { payersId, paymentCode, archdeaconry } = req.body;

  try {
    // Find all payers in the specified archdeaconry
    const response = await paymentCodeModel.find({ 'payerArchdeaconry': archdeaconry });

    // Check if no payers found in this archdeaconry
    if (!response || response.length === 0) {
      return res.status(200).json({
        data: "Nothing",
        message: "No Payment For Your Archdeaconry"
      });
    }

    // Find the specific payer by payerId
    const findSpecificPayer = await response.find(result => result.payerId === payersId);

    if (!findSpecificPayer) {
      throw new Error("Payer not found");
    }

    // Check if payer has codes
    if (!findSpecificPayer.codes || findSpecificPayer.codes.length === 0) {
      throw new Error("No payment codes found for this payer");
    }

    // Find the specific payment code
    const findSpecificCode = await findSpecificPayer.codes.filter(codes => codes.code === paymentCode);

    if (findSpecificCode.length === 0) {
      throw new Error("Invalid Code");
    }

    // Log for debugging
    console.log({ "Payer": findSpecificPayer, "Code": findSpecificCode });

    // Send success response
    return res.status(200).json({
      data: findSpecificCode,
      message: "Valid Code",
      payer: {
        id: findSpecificPayer.payerId,
        archdeaconry: findSpecificPayer.payerArchdeaconry
      }
    });

  } catch (err) {
    const error = errorHandling(err);
    console.error("Error From Code Verification:", error);
    res.status(500).json({
      location: "Code Verification",
      error: error
    });
  }
});



// routes.post('/verify-code', async (req, res) => {
//   const { payersId, paymentCode, archdeaconry } = req.body
//   console.table(payersId, paymentCode, archdeaconry)

//   try {

//     const response = await paymentCodeModel.find({ 'payerArchdeaconry': archdeaconry })
//     if (!response) {
//       throw new Error("No Payment Made For This Archdeaconry")
//     }
//     else {
//       const findSpecificPayer = await response.find(result => result.payerId == payersId)
//       if (findSpecificCode.length == 0) {
//         throw new Error({ message: "Invalid Code" })
//       }
      
//       const findSpecificCode = await findSpecificPayer.codes.filter(codes => codes.code == paymentCode)

//       console.log({ "Payer": findSpecificPayer, "Code": findSpecificCode })
//       res.status(200).json({ data: findSpecificCode, message: "Valid Code" })
//     }
//   }
//   catch (err) {
//     const error = errorHandling(err);
//     console.log(error);
//     res.status(400).json({ location: "Code Verification", errors: error });
//   }
// })




// routes.post('/verify-code', async (req, res) => {
//   const { payerId } = req.body
//   console.log("Payer ID:", payerId)
//   try {
//     const response = await paymentCodeModel.findOne({ 'payerId': payerId })
//     switch(response){
//       case null:
//         res.status(200).json({data: "Nothing", message: "No Code Generated For This Payer"})
//         break;
//       default:
//         res.status(200).json({data: response})
//         break;
//     }
//   }
//   catch (err) {
//     const error = errorHandling(err);
//     console.log(error);
//     res.status(400).json({location: "Code Verification", errors: error });
//   }
// })


module.exports = routes;
