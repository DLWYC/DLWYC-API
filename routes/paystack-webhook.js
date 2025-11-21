// Backend: routes/paystack-webhook.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const UserRegisteredEventsModel = require('../models/userEventsRegistered');
const { paymentCodeModel } = require('../models/paymentCodes');
const axios = require('axios');

// Verify Paystack signature
const verifyPaystackSignature = (req) => {
     const hash = crypto
          .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
          .update(JSON.stringify(req.body))
          .digest('hex');

     return hash === req.headers['x-paystack-signature'];
};

// Paystack Webhook Handler
router.post('/paystack-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
     try {
          // Verify the signature
          if (!verifyPaystackSignature(req)) {
               console.error('Invalid Paystack signature');
               return res.status(400).send('Invalid signature');
          }

          // Parse the body (it's raw at this point)
          const event = JSON.parse(req.body.toString());

          console.log('Webhook received:', event.event);
          console.log('Webhook data:', event.data);

          // Handle different webhook events
          switch (event.event) {
               case 'charge.success':
                    await handleSuccessfulCharge(event.data);
                    break;

               case 'charge.failed':
                    console.log('Payment failed:', event.data.reference);
                    break;

               default:
                    console.log('Unhandled webhook event:', event.event);
          }

          // Always respond with 200 to acknowledge receipt
          res.status(200).send('Webhook received');

     } catch (error) {
          console.error('Webhook processing error:', error);
          res.status(500).send('Webhook processing failed');
     }
});

// Handle successful charge
async function handleSuccessfulCharge(data) {
     try {
          const { reference, customer, metadata, amount, channel, paid_at, id } = data;

          console.log('Processing successful charge:', reference);

          // Extract metadata
          const userId = metadata?.userId || customer?.metadata?.userId;
          const paymentOption = metadata?.paymentOption;
          const numberfPeopleToBePayedFor = metadata?.numberfPeopleToBePayedFor || 0;
          const eventId = metadata?.eventId;
          const eventTitle = metadata?.eventTitle;

          if (!userId || !eventId) {
               console.error('Missing required metadata:', { userId, eventId });
               return;
          }

          // Check if already registered (prevent duplicate processing)
          const existing = await UserRegisteredEventsModel.findOne({
               'userProfile.uniqueID': userId,
               'event': {
                    $elemMatch: {
                         eventId: eventId,
                         reference: reference
                    }
               }
          });

          if (existing) {
               console.log('Payment already processed:', reference);
               return;
          }

          // Get user details
          const userModel = require('../models/userModels').userModel;
          const user = await userModel.findOne({ uniqueID: userId });

          if (!user) {
               console.error('User not found:', userId);
               return;
          }

          // Prepare registration data
          const registrationData = {
               userProfile: {
                    uniqueID: userId,
                    fullName: user.fullName,
                    email: user.email
               },
               event: {
                    eventId: eventId,
                    eventTitle: eventTitle,
                    registrationStatus: true,
                    paymentOption: paymentOption,
                    amountOfPeople: paymentOption === 'multiple' ? String(numberfPeopleToBePayedFor + 1) : "1",
                    paymentID: id,
                    paymentStatus: 'success',
                    reference: reference,
                    modeOfPayment: channel,
                    paymentTime: paid_at,
                    checkedInStatus: false
               }
          };

          // Register the event
          let userRegistration = await UserRegisteredEventsModel.findOne({
               'userProfile.uniqueID': userId
          });

          if (userRegistration) {
               userRegistration.event.push(registrationData.event);
               await userRegistration.save();
          } else {
               userRegistration = new UserRegisteredEventsModel({
                    userProfile: registrationData.userProfile,
                    event: [registrationData.event]
               });
               await userRegistration.save();
          }

          console.log('Event registered successfully via webhook');

          // Generate codes for multiple payment
          if (paymentOption === 'multiple') {
               console.log('Generating codes for multiple payment...');

               // Generate codes
               const codesResponse = await axios.post(`${process.env.BACKEND_URL}/api/payment/generate-code`, {
                    numberOfPersons: numberfPeopleToBePayedFor
               });

               // Save codes
               await axios.post(`${process.env.BACKEND_URL}/api/payment/save-codes`, {
                    payerId: userId,
                    payerArchdeaconry: user.archdeaconry,
                    eventId: eventId,
                    eventTitle: eventTitle,
                    codes: codesResponse.data.data
               });

               console.log('Codes generated and saved via webhook');
          }

     } catch (error) {
          console.error('Error handling successful charge:', error);
          throw error;
     }
}

module.exports = router;