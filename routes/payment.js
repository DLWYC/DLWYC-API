require("dotenv").config();
const express = require("express");
const routes = express.Router();
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const { UserRegisteredEventsModel } = require("../models/userEventsRegistered");

const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);

routes.get("/:reference/:paymentOption", async (req, res) => {
  // let data;
  let users;
  const reference = req.params.reference;
  const paymentOption = req.params.paymentOption;

  try {
    await paystack.transaction.verify(reference).then(async (response) => {
      // console.log("RESPONSE:", response)
      const paymentMode = await response.data.channel;
      const paymentStatus = await response.data.status;
      const paymentTime = await response.data.paid_at;
      const email = await response.data.customer.email;
      const paymentDetails = {
        "payment.modeOfPayment": paymentMode,
        "payment.reference": reference,
        "payment.paymentStatus": paymentStatus,
        "payment.paymentTime": paymentTime,
      };

      // If there are external Meta_data Like other users
      if (response.data.metadata && response.data.metadata.custom_fields) {
        users = response.data.metadata.custom_fields[0].variable_name;
      }
       res.status(200).json({data: paymentDetails, full: response})
      // console.log(paymentDetails)

      // if (response.data.status === "success") {
      //   // If it is a single picked eg. No Other users
      //   if (paymentOption == "single") {
      //     data = await UserRegisteredEventsModel.findOneAndUpdate(
      //       { email: email },
      //       {
      //         $set: paymentDetails,
      //       },
      //       { new: true, upsert: false }
      //     );
      //     // client.sendTask("tasks.sendPaymentEmail", [
      //     //   {
      //     //     email: data.email,
      //     //     uniqueID: data.uniqueID,
      //     //     fullName: data.fullName,
      //     //   },
      //     // ]);
      //   }

      //   // If there is meta data i.e paying for other users
      //   else if (paymentOption === "Multiple") {
      //     // the person hat will pay
      //     data = await UserRegisteredEventsModel.findOneAndUpdate(
      //       { email: email },
      //       {
      //         $set: paymentDetails,
      //       },
      //       { new: true, upsert: false }
      //     );
      //     // client.sendTask("tasks.sendPaymentEmail", [
      //     //   {
      //     //     email: data.email,
      //     //     uniqueID: data.uniqueID,
      //     //     fullName: data.fullName,
      //     //   },
      //     // ]);

      //     // All the other users to eb paied for
      //     users.forEach(async camper => {
      //       await UserRegisteredEventsModel.updateMany(
      //         { uniqueID: camper.value },
      //         {
      //           $set: paymentDetails,
      //         },
      //         { new: true, upsert: false }
      //       );
      //       // client.sendTask("tasks.sendPaymentEmail", [
      //       //   {
      //       //     email: camper.email,
      //       //     uniqueID: camper.value,
      //       //     fullName: camper.label,
      //       //   },
      //       // ]);
      //     });



      //   }


      //   // Send This details to the celery worker to send the email
      //   res.status(200).json(response);
      // } else {
      //   throw "Error Sending email";
      // }
    })
      .catch((err) => {
        throw err;
      });

  }


  catch (err) {
    const error = errorHandling(err);
    console.log(error);
    res.status(400).json({ errors: error });
  }
});





// routes.post("/", cors(), async (req, res) => {
//   const { email, paymentUrl } = req.body;

//   const checkIfUserHasPayedBefore = await UserRegisteredEventsModel.findOne({
//     email: email,
//     "payment.paymentStatus": "success",
//   });

//   if (checkIfUserHasPayedBefore === null) {
//     try {
//       console.log("first" + paymentUrl);

//       res
//         .status(200)
//         .json({ message: "Payment Initialized", paymentUrl: paymentUrl });
//       console.log(`fro payment.js ${paymentUrl}`);
//     } catch (error) {
//       const err = await errorHandling(error);
//       console.log(err);
//       res.status(400).json({ errors: err });
//     }
//   } else {
//     res.status(208).json({ error: "Payed Already" });
//   }
// });

// routes.post("/"(), async (req, res) => {
//   const { email, paymentUrl } = req.body;

//   const checkIfUserHasPayedBefore = await UserRegisteredEventsModel.findOne({
//     email: email,
//     "payment.paymentStatus": "success",
//   });

//   if (checkIfUserHasPayedBefore === null) {
//     try {
//       console.log("first" + paymentUrl);

//       res
//         .status(200)
//         .json({ message: "Payment Initialized", paymentUrl: paymentUrl });
//       console.log(`fro payment.js ${paymentUrl}`);
//     } catch (error) {
//       const err = await errorHandling(error);
//       console.log(err);
//       res.status(400).json({ errors: err });
//     }
//   } else {
//     res.status(208).json({ error: "Payed Already" });
//   }
// });

module.exports = routes;
