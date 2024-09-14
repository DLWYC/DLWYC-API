require("dotenv").config();
const celery = require("celery-node");
const nodemailer = require("nodemailer");
const { errorHandling } = require("./controllers/errorHandler");

const worker = celery.createWorker();

// ## To Create & Connect The Network Successfuly
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

try {
  transporter.verify((error, success) => {
    if (error) {
      console.log(`Error With Node Mailer ${error}`);
    } else {
      console.log(`NodeMailer is ready to send the mails ${success}`);
    }
  });
} catch (error) {
  const err = errorHandling(err);
  console.log(`Error from Nodemailer Connection ${err}`);
  return err;
}

worker.register("tasks.sendEmail", async (args, task) => {
  const { email, uniqueID, fullName, archdeaconry, parish } = args;
  console.log(args);

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Camp Registration",
    html: `
          <div>
          <b>THANK YOU FOR SUCCESSFULLY REGISTERING FOR THE 2024 DIOCESAN YOUTH CONFERENCE.</b>

          <p>
               <b>DATE</b>: 18TH-21ST DECEMBER,2024
               <br/>
               <b>VENUE</b>: CITY OF GOD, MAJIYAGBE LAYOUT, IPAJA
               <br/>
               <b>CHECK-IN TIME</b>: STARTS AT 12:00 NOON
          </p>

          <br/>

          <b> Here are your details: </b>
          <ol>
            <li>UNIQUE ID: ${uniqueID}</li>   
            <li>NAME : ${fullName}</li>   
            <li>ARCHDEACONRY: ${archdeaconry} </li>   
            <li>PARISH: ${parish} </li>   
          </ol>
           

          CHECKLIST
          ...........................
          <br/>
          

          RULES AN REGULATIONS 
          ......................

          <p>
          Please kindly note that your <b>UNIQUE ID: ${uniqueID} </b> is for you alone and it can be use to register for subsequent events easily.

          Remain Blessed & See You There
          </p>
          <b> DLWYC CONFERENCE PLANNING COMMITTEE <b/>
          </div>
          `,
  };

  try {
    const response = await transporter.sendMail(mailOptions);
    console.log(response);
    return response;
  } catch (err) {
    const error = errorHandling(err);
    console.log(`Error from sending email: ${error}`);

    if (
      error.message.include("Unexpected socket close") ||
      error.message.include("connect ENETUNREACH 173.194.79.109:465")
    ) {
     throw new Error("Temporary Network issues, retrying....")
    } else {
      throw error;
    }
  }

  // })
});

worker.start();
