const { UserModel } = require("../models/users");
const logger = require("../config/logger");
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashPassword } = require("../services/authenticationService")
const config = require("../config/index");
const cloudinary = require('../config/cloudinary');
const { errorHandler } = require("../utils/errorhandler");
const jwt = require('jsonwebtoken');
const emailQueue = require("../services/emailingService");

const timestamp = Date.now();
const formatter = new Intl.DateTimeFormat('en-US', {
     year: 'numeric',
     month: '2-digit',
     day: '2-digit',
     hour: '2-digit',
     minute: '2-digit',
     second: '2-digit',
     hour12: false
});

const cookieOptions = {
     httpOnly: true,
     secure: config.env === 'production' ? true : false,
     // sameSite: 'strict',
}

const LoginController = async (req, res) => {
     try {
          const { email, password } = req.body
          if (!email || !password) {
               logger.error("Unique ID or Password Not Provided")
               return res.status(400).json({ message: "Unique ID or Password Not Provided" })
          }

          // Check To Seee If User Exist In The DB
          const user = await UserModel.findOne({ email }).select('+password');
          if (!user) {
               logger.error(`Logging with invalid credentials`)
               return res.status(401).json({ error: "Wrong User Name Or Password" })
          }

          const isMatch = await user.comparePassword(password)
          if (!isMatch) {
               return res.status(401).json({ error: "Wrong User Name Or Password" })
          }

          const [accessToken, refreshToken] = await Promise.all([generateAccessToken(user), generateRefreshToken(user)])
          console.log("Access Token: ", accessToken)


          res.cookie('accessToken', accessToken, {
               ...cookieOptions,
               maxAge: 10 * 60 * 1000
          })

          res.cookie('refreshToken', refreshToken, {
               ...cookieOptions,
               maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          })


          logger.info(`${email} Logged in Successfully @ ${formatter.format(timestamp)}`)
          return res.status(200).json({
               message: "User Logged In Successfully",
          })

     }
     catch (error) {
          logger.error(`Error Logging In User ${error}`)
          res.status(500).json({ error: `Error Logging In User ${error.message}` })
     }

}


const LogOutController = async (req, res) => {
     const { uniqueId } = req.user
     try {
          res.clearCookie('accessToken', { httpOnly: true, secure: config.env === 'production', path: '/' });
          res.clearCookie('refreshToken', { httpOnly: true, secure: config.env === 'production', path: '/' });


          logger.info(`${uniqueId} Logged out Successfully @ ${formatter.format(Date.now())}`)
          return res.status(200).json({
               message: "User Logged Out Successfully",
          })
     }
     catch (error) {
          logger.error(`Error Logging User Out ${error}`)
          res.status(500).json({ error: `Error Logging User out ${error.message}` })
     }
}

const NewUserRegistrationController = async (req, res) => {
     try {
          const { fullName, email, phoneNumber, gender, archdeaconry, parish, age, password, profilePicture } = req.body;

          // Check IF User Exist Already
          const existingUser = await UserModel.findOne({ email }).lean()
          if (existingUser) {
               logger.error({ message: `${fullName} has registered before` })
               return res.status(409).json({ message: "Sorry, this user has registered before" })
          }

          const user = await UserModel.create({
               fullName: fullName,
               email: email,
               phoneNumber: phoneNumber,
               gender: gender,
               age: age,
               password: password,
               archdeaconry: archdeaconry,
               parish: parish,
          })
          
          const [accessToken, refreshToken] = await Promise.all([generateAccessToken(user), generateRefreshToken(user)])
          console.log("Access Token: ", accessToken)


          res.cookie('accessToken', accessToken, {
               ...cookieOptions,
               maxAge: 10 * 60 * 1000
          })

          res.cookie('refreshToken', refreshToken, {
               ...cookieOptions,
               maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          })

          logger.info(`${user.fullName} Account Created Successfully`)
          return res.status(201).json({ message: `${user.fullName} Account Created Successfully` })

     }
     catch (error) {
          const errors = await errorHandler(error)
          console.log("Error Creating User...", errors)
          res.status(500).json({ message: "Error creating User", errors })
     }

}


const NewUserProfilePictureUpload = async (req, res) => {
     const { uniqueID } = req.query

     // Check if there is a file uploaded
     try {
          if (!req.file) {
               logger.error(`No Image File Provided`)
               res.status(400).json({ error: "Please Provide An Image" })
          }

          const user = await UserModel.findOne({ uniqueID })
          if (!user) {
               return res.status(404).json({ error: "User Not Found", type: "Upload Error" })
          }

          const folderName = user.archdeaconry ? user.archdeaconry.toLowerCase() : 'general'

          const cloudinaryResponse = await new Promise((resolve, reject) => {
               cloudinary.uploader.upload_stream({
                    folder: `DLWYC_YOUTHS/${folderName}`,
                    public_id: `user_${uniqueID}`,
                    overwrite: true,
                    resource_type: "auto",
                    transformation: [
                         { width: 500, height: 500, crop: "limit" },
                         { quality: 'auto' }
                    ]
               }, (err, result) => (err ? reject(err) : resolve(result))
               ).end(req.file.buffer)
          })


          user.profilePicture = cloudinaryResponse.secure_url,
               user.cloudinaryPublicId = cloudinaryResponse.public_id
          await user.save()
          res.status(201).json({ message: "Image Uploaded Successfully" })
     }
     catch (error) {
          console.log(error)
          logger.error(`Error uploading Picture ${error}`);
          return res.status(500).json({
               error: " Internal Server Error During Upload",
               type: "Upload Error"
          })
     }
}


const RequestForgetPasswordLinkController = async (req, res) => {
     const { email } = req.body;

     // Check the DB to know if user exists
     try {
          const user = await UserModel.findOne({ email }).select('+password').lean()
          if (!user) {
               logger.error("Password reset requested for non-existent email address.");
               return res.status(200).json({ message: "If this email is registered, you'll receive a reset link shortly." });
          }

          const resetToken = await jwt.sign({ uniqueID: user?.uniqueID, password: user?.password }, config.security.jwtSecret, { expiresIn: '5m' })
          console.log({ token: resetToken, message: "This is the restToken" })
          emailQueue.push({
               to: email,
               subject: "Password Reset Notification",
               html: `
               <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body {
      height: 100% !important; margin: 0 !important; padding: 0 !important;
      width: 100% !important; background-color: #f4f5f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    a[x-apple-data-detectors] {
      color: inherit !important; text-decoration: none !important;
      font-size: inherit !important; font-family: inherit !important;
      font-weight: inherit !important; line-height: inherit !important;
    }
  </style>
</head>
<body style="margin:0 !important; padding:0 !important; background-color:#f4f5f8;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" bgcolor="#f4f5f8" style="padding: 40px 10px;">

        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td align="center" valign="top" style="padding: 0 0 30px 0;">
                            <img src="https://dlwyouth.org/main_logo.svg" alt="dlwyc" width="140" style="display: block; font-family: sans-serif; color: #00a5f4; font-size: 22px; font-weight: bold;" border="0">
                        </td>
          </tr>

          <!-- Card -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%"
                style="background:#ffffff; border:1px solid #e2e4ea; border-radius:12px; overflow:hidden;">

                <!-- Header bar -->
                <tr>
                  <td height="4" style="background:#091e54; font-size:0; line-height:0;">&nbsp;</td>
                </tr>

                <!-- Body -->
                <tr>
                  <td align="left" style="padding: 36px 40px; font-size:14px; line-height:24px; color:#4a4a4a;">

                    <h2 style="font-size:17px; font-weight:500; margin:0 0 6px; color:#091e54;">
                      Hi, ${user.fullName}
                    </h2>

                    <p style="margin:0 0 28px; color:#5c677d; font-size:13.5px; line-height:1.75;">
                      We received a request to reset the password for your account.
                      Click the button below to get started. This link is only valid for 5 Minutes.
                    </p>

                    <!-- Expiry badge -->
                    <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td style="background:#f4f5f8; border-radius:8px; padding:8px 14px;
                          font-size:12.5px; color:#27305f; font-weight:500;">
                          &#x23F0; Expires in 5 Minutes &nbsp;·&nbsp; Single use only
                        </td>
                      </tr>
                    </table>

                    <!-- CTA Button -->
                    <table border="0" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                      <tr>
                        <td align="center" bgcolor="#091e54" style="border-radius:10px;">
                          <a href="${config.client.domain}/resetPassword?token=${resetToken}" target="_blank"
                            style="display:inline-block; padding:13px 32px; font-size:13.5px;
                            color:#ffffff; font-weight:500; text-decoration:none;
                            border-radius:10px; background:#091e54; letter-spacing:0.3px;">
                            Reset my password &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:22px;">
                      <tr><td height="1" style="background:#e8eaef; font-size:0; line-height:0;">&nbsp;</td></tr>
                    </table>

                    <!-- Notice -->
                    <p style="margin:0; font-size:12px; color:#687787; line-height:1.7;">
                      Didn't request this? You can safely ignore this email. If you suspect
                      unauthorized access, contact us at
                      <a href="mailto:help@yourbrand.com" style="color:#27305f; font-weight:500;
                        text-decoration:none;">help@yourbrand.com</a>.
                    </p>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:14px 40px 20px; border-top:1px solid #e8eaef;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="font-size:11.5px; color:#9aa5b4;">© 2026  <img src="https://dlwyouth.org/main_logo.svg" alt="dlwyc" width="140" style="display: block; font-family: sans-serif; color: #00a5f4; font-size: 22px; font-weight: bold;" border="0"></td>
                        <td align="right" style="font-size:11.5px; color:#27305f; font-weight:500;">
                          &#x1F512; Encrypted &amp; secure
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>

          `
          })
          return res.status(201).json({ message: "Reset Link Created Successfully", token: resetToken })
     }
     catch (error) {
          logger.error(`Error Message: ${error} :::: Reset Password Route`)
          return res.status(500).json({ error: "Error Creating Password Reset Link", type: "Reset Password" })
     }

}


const ResetUserPasswordController = async (req, res) => {
     const { token } = req.query
     const { password } = req.body
     console.log(token, password)
     try {

          const decodedUser = await jwt.verify(token, config.security.jwtSecret);
          if (!decodedUser || !decodedUser.uniqueID) {
               logger.error("Invalid Credentials in Token");
               return res.status(401).json({ error: "Invalid Credentials", type: "Reset Password" });
          }

          const hashedPassword = await hashPassword(password)

          const updateResponse = await UserModel.updateOne(
               { uniqueID: decodedUser.uniqueID },
               { $set: { password: hashedPassword } } // Replace with your actual password field name
          );


          if (updateResponse.matchedCount === 0) {
               logger.error(`User not found for uniqueID: ${decodedUser.uniqueID}`);
               return res.status(404).json({ error: "User not found", type: "Reset Password" });
          }

          // 4. Always return a success response to the client
          return res.status(200).json({ message: "Password reset successful", type: "Reset Password" });


     }
     catch (error) {
          logger.error(`Error Resetting User Password? ${error}`)
          return res.status(410).json({ error: "Invalid Token", type: "Reset Password" })
     }

}


const UserRefreshTokenController = async (req, res) => {
     const token = req.cookies.refreshToken;
     if (!token) {
          logger.error("Unauthorize, No Refresh Token Provided")
          return res.status(401).json({ message: "Unauthorized" })
     }

     try {
          const decoded = await verifyRefreshToken(token);
          const newAccessToken = await generateAccessToken(decoded)

          res.cookie('accessToken', newAccessToken, {
               httpOnly: true,
               secure: config.env === 'production',
               // sameSite: 'strict',
               maxAge: 15 * 60 * 1000
          })

          return res.status(200).json({ message: "Token refreshed successfully" })
     }
     catch (err) {
          logger.error("Error Generating New Refresh Token")
          return res.status(500).json({ message: "Error Generating Refresh Token" })
     }
}

module.exports = { LoginController, UserRefreshTokenController, NewUserRegistrationController, NewUserProfilePictureUpload, RequestForgetPasswordLinkController, ResetUserPasswordController, LogOutController }