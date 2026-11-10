const nodemailer = require('nodemailer')
const config = require('./index')
const logger = require('./logger')

const transporter = nodemailer.createTransport({
     host: config.nodemailer.host,
     port: parseInt(config.nodemailer.port, 10),
     secure: config.nodemailer.port,
     auth: {
          user: config.nodemailer.auth.user,
          pass: config.nodemailer.auth.pass
     },
     pool: true,
     maaxConnections: 5,
     maxMessages: 100,
     rateLimit: 10
})

transporter.verify((error, success)=>{
     if(error){
          logger.error(`SMTP Connection Pool Error: ${error}`);
     }
     else{
          logger.info(`SMTP Connection Pool is ready to send messages`);
     }
})

module.exports = transporter