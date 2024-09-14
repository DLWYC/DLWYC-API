const nodemailer = require('nodemailer')


const mailer = async (email) =>{
     const transporter = await nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
               user: process.env.EMAIL,
               pass: process.env.EMAIL_PASSWORD
          }
     })

     transporter.verify((error, success)=>{
          if(error){
               console.log(`Error With Node Mailer ${error}`)
          }
          else{
               console.log(`NodeMailer is ready to send the mails ${success}`)
          }
     })

     const mailOptions = {
          from: process.env.EMAIL,
          to: email,
          subject: 'Camp Registration',
          html: `
          <div>
               <p> Greeting <b>$ddd</b>, Click The Link Below To Reset Your Password </p>
          </div>
          `
     }

     const mailer = await transporter.sendMail(mailOptions, (err, response)=>{
          if(err){
               console.log(`Error Sending Email ${err}`)
          }
          else{
               console.log("Mail Sent Successfully"+response.response)
          }
     })
     return(mailer)
     

}

module.exports = {mailer}