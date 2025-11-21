require("dotenv").config();
const express = require("express");
const routes = express.Router();
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);

/**
 * Initialize a Paystack transaction
 * @param {Object} payStackData - { email, amount, reference?, metadata?, channels? }
 * @returns {Promise} { status, data: { authorization_url, access_code, reference } }
 */
routes.post('/', async (req, res) => {
  const { payStackData } = req.body;
  console.log("Received Initialize Transaction Request:", payStackData);

  try {
    // Validate required fields
    if (!payStackData.email || !payStackData.amount) {
      throw new Error("Email and amount are required");
    }

    // Amount must be in kobo (multiply by 100)
    const normalizedData = {
      email: payStackData.email,
      amount: payStackData.amount * 100, // Convert naira to kobo
      reference: payStackData.reference || `ref_${Date.now()}`,
      metadata: payStackData.metadata || {},
      channels: payStackData.channels || ["card", "bank_transfer"]
    };

    console.log("Initializing transaction with:", normalizedData);

    const response = await paystack.transaction.initialize(normalizedData);

    // Handle Paystack error responses
    if (response.code === "invalid_email_address") {
      throw new Error("Invalid Email Address Or No Email Address Passed");
    }

    if (!response.status) {
      throw new Error(response.message || "Failed to initialize transaction");
    }

    res.status(200).json({
      status: true,
      data: response.data,
      message: response.message
    });
  } catch (err) {
    console.error("Initialize Transaction Error:", err);
    res.status(400).json({
      status: false,
      error: err.message || "Transaction initialization failed",
      details: err
    });
  }
});
