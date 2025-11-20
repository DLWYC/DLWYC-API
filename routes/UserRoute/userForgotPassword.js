const express = require('express')
const routes = express.Router()
const { userModel } = require("../../models/userModels");
const jwt = require('jsonwebtoken');
const { errorHandling } = require('../../controllers/errorHandler');
const { Resend } = require('resend');



routes.post("/", async (req, res) => {
     const resend = new Resend(process.env.RESEND_API_KEY);
     const { email } = req.body;

     try {
          if (!email || email == "") {
               res.status(400).json({ message: "Email Field Is Required" })
          }

          const student = await userModel.findOne({ "email": email })
          if (!student) {
               return "Sorry This User Does Not Exist";
          }
          const secret_key =
               process.env.JWT_SECRET_KEY + student.password;
          const maxAge = 15 * 60 * 60;
          const token = jwt.sign({ id: student._id }, secret_key, {
               expiresIn: maxAge,
          });

          const resetLink = process.env.BACKEND_MAIN_ROUTE + `/api/resetPassword/${student._id}/${token}`;

          // Generate reset link first
          const emailStatus = await resend.emails.send({
               from: 'DLW Youth <dlwyouth@gmail.com>', // Change to your verified domain
               to: [email],
               subject: 'Reset Password Link',
               html: `<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
     <h2>Password Reset Request</h2>
     <p>Hello,</p>
     <p>We received a request to reset your password. Click the link below to reset it:</p>
     <p>
          <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
               Reset Password
          </a>
     </p>
     <p>Or copy and paste this link into your browser:</p>
     <p style="color: #666; word-break: break-all;">${resetLink}</p>
     <p><strong>Note:</strong> This link will expire in 1 hour.</p>
     <p>If you didn't request this, please ignore this email.</p>
     <p>Best regards,<br>The DLWYC Team</p>
</body>
</html>`
          });

          console.log("Email Status:", emailStatus);
          res.status(200).json({ message: "Success", data: resetLink });
     }
     catch (error) {
          const err = errorHandling(error);
          res.status(400).json({ errors: err, message: "Input Errors" });
     }
});


module.exports = routes;