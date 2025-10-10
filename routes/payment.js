require("dotenv").config();
const express = require("express");
const routes = express.Router();
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const { paymentCodeModel } = require("../models/paymentCodes");

const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);


routes.get("/payment-history/:userUniqueId(.*)", async (req, res) => {
  const { userUniqueId } = req.params
  console.table({ "userUniqueId": userUniqueId, "type": typeof userUniqueId })
  try {

    const paymentData = await paymentCodeModel.findOne({ "payerId": userUniqueId })
    console.log("Data", paymentData)

    if (!paymentData) {
      return res.status(200).json({ data: [] })
    }
    res.status(200).json({ data: paymentData.codes })
  }
  catch (err) {
    const error = errorHandling(err);
    console.log(error);
    res.status(400).json({ errors: error });
  }
})




// Verify Payment
routes.post("/verify-payment", async (req, res) => {
  const { reference, userId } = req.body
  console.table({ "refernce": reference, "UserId": userId, })

  try {
    const responseData = await paystack.transaction.verify(reference)
    // const data = responseData?.data
    // console.info("Verified Data", data)
    // res.status(200).json({ message: "Response", data: data })
    const data = responseData?.data || responseData?.body?.data || responseData;
    console.info("Verified Data:", data);

    // Check if data exists and has status
    if (!data || !data.status) {
      throw new Error("Invalid response from Paystack");
    }

    res.status(200).json({
      message: "Payment verified successfully",
      data: data
    });
  }


  catch (err) {
    // Log full error details
    console.error("Error Verify - Full Error:", err);
    console.error("Error Message:", err.message);
    console.error("Error Stack:", err.stack);
    console.error("Error Response Data:", err.response?.data);
    
    const error = errorHandling(err);
    console.log("Error Verify:", error);
    res.status(400).json({ errors: error });
  }
});



routes.post('/verify-code', async (req, res) => {
  const { payersId, paymentCode, archdeaconry, eventTitle } = req.body;

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
    console.log("Find Payere", findSpecificPayer)

    if (!findSpecificPayer) {
      throw new Error("Payer not found");
    }

    if (findSpecificPayer.eventTitle != eventTitle) {
      throw new Error("Invalid Code For Event")
    }

    // Check if payer has codes
    if (!findSpecificPayer.codes || findSpecificPayer.codes.length === 0) {
      throw new Error("No payment codes found for this payer");
    }

    // Find the specific payment code
    const findSpecificCode = await findSpecificPayer.codes.find(codes => codes.code === paymentCode);

    if (!findSpecificCode) {
      throw new Error("Invalid Code");
    }

    if (findSpecificCode.status == "Used") {
      throw new Error("Sorry This Code Has Been Used");
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



routes.post('/generate-code', async (req, res) => {
  const { numberOfPersons } = req.body

  const codes = new Set(); // Use Set to ensure uniqueness
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; // 36 possible characters
  const originalSize = codes.size;

  while (codes.size < originalSize + numberOfPersons) {
    // Generate exactly 7 random characters
    const code = Array.from({ length: 7 }, () =>
      characters[Math.floor(Math.random() * characters.length)]
    ).join('');

    codes.add(code);
  }
  // const codesArray = Array.from(codes).slice(originalSize);
  const codesArray = Array.from(codes).slice(originalSize).map((code, index) => ({
    codeId: index + 1,
    code: code,
    status: "Not Used",
    userName: null,
    userEmail: null,
    userId: null,
    createdAt: new Date().toISOString()
  }));
  console.log("codesArray", codesArray)

  res.status(200).json({ data: codesArray });
})




routes.post('/save-codes', async (req, res) => {
  const { payerId, payerArchdeaconry, codes, eventId, eventTitle } = req.body
  console.log("Payer ID:", payerId)

  try {
    console.profile("Creating New Payer Record");
    const existingPayer = await paymentCodeModel.findOne({ $and: [{ 'payerId': payerId }, { 'eventTitle': eventTitle }] })

    const newPaymentData = await new paymentCodeModel({
      "payerId": payerId,
      "payerArchdeaconry": payerArchdeaconry,
      "eventId": eventId,
      "eventTitle": eventTitle,
      "codes": codes
    })
    // User Has no Payed For Pple Before
    if (!existingPayer) {
      console.log("Nothing Yet")
      const newPaymentWithCode = await paymentCodeModel.create(newPaymentData)
      res.status(200).json({ data: newPaymentWithCode, message: "Saved Successfully" })
    }
    else {
      console.log("Adding codes to existing payer");
      existingPayer.codes.push(...codes);

      // Save the updated document
      const updatedPayer = await existingPayer.save();

      return res.status(200).json({
        data: updatedPayer,
        message: "Added new codes successfully",
        totalCodes: updatedPayer.codes.length
      });
    }
  }
  catch (err) {
    const error = errorHandling(err);
    console.log(error);
    res.status(400).json({ location: "Code Verification", errors: error });
  }
})


routes.patch('/update-code-status', async (req, res) => {
  const { payersId, paymentCode, archdeaconry, eventTitle, userName, userId, userEmail } = req.body;

  console.log("Values asd", archdeaconry, eventTitle)

  try {
    const findArchdeaconry = await paymentCodeModel.find({ 'payerArchdeaconry': archdeaconry });

    if (!findArchdeaconry || findArchdeaconry.length === 0) {
      return res.status(200).json({
        data: "Nothing",
        message: "No Payment For Your Archdeaconry"
      });
    }

    const findSpecificPayer = findArchdeaconry.find(result => result.payerId === payersId);

    if (!findSpecificPayer) {
      throw new Error("Payer not found");
    }

    if (findSpecificPayer.eventTitle != eventTitle) {
      throw new Error("Invalid Code For Event");
    }

    if (!findSpecificPayer.codes || findSpecificPayer.codes.length === 0) {
      throw new Error("No payment codes found for this payer");
    }

    // Find the specific payment code
    const codeIndex = findSpecificPayer.codes.findIndex(codes => codes.code === paymentCode);

    if (codeIndex === -1) {
      throw new Error("Invalid Code");
    }

    // Update the specific code using MongoDB's positional operator
    const updatedPayer = await paymentCodeModel.findOneAndUpdate(
      {
        'payerId': payersId,
        'codes.code': paymentCode
      },
      {
        $set: {
          'codes.$.status': 'Used',
          'codes.$.userName': userName,
          'codes.$.userEmail': userEmail,
          'codes.$.userId': userId,
          'codes.$.usedAt': new Date()
        }
      },
      { new: true } // Return updated document
    );

    // Find the updated code to return
    const updatedCode = updatedPayer.codes.find(code => code.code === paymentCode);

    console.log("Updated Code:", updatedCode);

    return res.status(200).json({
      success: true,
      data: updatedCode,
      message: "Code status updated successfully",
      payer: {
        id: updatedPayer.payerId,
        archdeaconry: updatedPayer.payerArchdeaconry
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




module.exports = routes;
