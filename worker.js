require("dotenv").config();
const celery = require("celery-node");
const nodemailer = require("nodemailer");
const { errorHandling } = require("./controllers/errorHandler");

const worker = celery.createWorker(process.env.BROKER_URL, process.env.BROKER_URL);


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

worker.register("tasks.sendPaymentEmail", async (args, task) => {
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
      throw new Error("Temporary Network issues, retrying....");
    } else {
      throw error;
    }
  }

  // })
});

worker.register("tasks.sendRegistrationEmail", async (args, task) => {
  const { email, uniqueID, fullName, archdeaconry, parish, paymentURL, } = args;
  console.log(args);

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Camp Registration Email",
    html: `
          <div>
          <b>THANK YOU FOR SUCCESSFULLY REGISTERING TO BECOME A PART OF THE DIOCESE OF LAGOS WEST YOUTH CHAPLAINCY FAMILY.</b>

          <p>
               Please Do Well To Note The Following Information Below As They Will Be Used To <span style='color: red; font-weight: bold;' >Uniquely</span> Identify You As A Member Of DLWYC
          </p>

          <br/>

          <b> Here are your details: </b>
          <ol>
            <li>UNIQUE ID: ${uniqueID}</li>
            <li>NAME : ${fullName}</li>  
            ${archdeaconry === null ? ("") : `<li>ARCHDEACONRY: ${archdeaconry}</li>`} 
            ${archdeaconry === null ? ("") : `<li>PARISH: ${parish}</li>`} 
          </ol>
           
          <p>
         <span> Please kindly note that your <b style='color: red; font-weight: bold;'>UNIQUE ID: ${uniqueID} </b> is for you alone and it can be use to register for subsequent events easily. </span>

         <span> Click The Link Below To Proceed To Make Payment For This Year Camp <b style='color: red; font-weight: bold;'> <a href=${paymentURL}>Click Here</a> </b> is for you alone and it can be use to register for subsequent events easily. </span>

          Remain Blessed & See You There
          </p>
          <b> DIOCESAN YOUTH CHAPLAINCY <b/>
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
      throw new Error("Temporary Network issues, retrying....");
    } else {
      throw error;
    }
  }

  // })
});

worker.start();
