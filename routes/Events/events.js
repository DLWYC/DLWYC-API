const express = require('express')
const router = express.Router()
const { FreeEventRegistrationController, eventCodeVerificationController } = require('../../controllers/eventsController')
const { PaystackWebHookController, InitializePaystackTransactionController } = require('../../controllers/paymentController')
const authenticateToken = require("../../middlewares/authentication")

router.post('/free', authenticateToken, FreeEventRegistrationController)
router.post('/verify-code', authenticateToken, eventCodeVerificationController)


router.post('/initializeTransaction', authenticateToken, InitializePaystackTransactionController)
router.post('/paystack-webhook', express.raw({ type: 'application/json' }),

     (req, res, next) => {
          try {
               if (Buffer.isBuffer(req.body)) {
                    req.body = JSON.parse(req.body.toString())
               }
               next()
          }
          catch (error) {
               return res.status(400).send("Invalid JSON payload structure")
          }
     },
     PaystackWebHookController
)


module.exports = router