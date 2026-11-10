const fastq = require('fastq');
const { Resend } = require('resend')
// const transporter = require('../config/nodemailer')
const config = require("../config/index");
const logger = require('../config/logger');

const resend = new Resend(config.nodemailer.auth.pass)

const wait = (ms) => new Promise((resolve, ms)=> setTimout(ms))

const sendEmailWorker = async (task) => {
     const maxAttempt = 3
     for (let attempt = 1; attempt <= maxAttempt; attempt++) {
          try {
               await resend.emails.send({
                    from: '"DLWYC ICT" <onboarding@resend.dev>',
                    to: task.to,
                    subject: task.subject,
                    html: task.html
               })

               logger.info(`[Success] Email sent to ${task.to} on attempt #${attempt} `)
               return;
          }
          catch (error) {
               logger.error(`[Email Failure] failed sending to ${task.to}`)
               if (attempt < maxAttempt) {
                    const delay = attempt * 2000
                    logger.warn(`[Retry] Waitn ${delay / 1000}s before next attempt...`)
                    await wait(delay)
               }
               else {
                    logger.error(`[Error] Email to ${task.to} failed completely after ${maxAttempt} attempts...`)
               }
          }
     }
}


const emailQueue = fastq.promise(sendEmailWorker, 4)

module.exports = emailQueue