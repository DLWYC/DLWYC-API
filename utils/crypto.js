const crypto = require("crypto");
const config = require('../config/index')


const VerifyPaystackSignature = (req) => {
     const hash = crypto.createHmac("sha512", config.paystack.secret_key).update(JSON.stringify(req.body)).digest('hex')
     const payStackHeader = req.headers['x-paystack-signature']

     return hash == payStackHeader
}


module.exports = { VerifyPaystackSignature }