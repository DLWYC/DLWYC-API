require("dotenv").config();
const express = require("express");
const routes = express.Router();
const { campersModel } = require("../models/models");
const cors = require("cors");
const { errorHandling } = require("../controllers/errorHandler");
const celery = require("celery-node");
const client = celery.createClient(process.env.BROKER_URL, process.env.BROKER_URL)
const { initializeTransaction } = require("../utils/initializeTransaction");
const {allocateHostels} = require("../controllers/roomAllocation")


routes.get("/", async (req, res) => {
  campers = await campersModel.find();
  res.json(campers);
});




routes.post("/", cors(), async (req, res) => {
  const { fullName, email, phoneNumber, gender, archdeaconry, parish, age, camperType, denomination, paymentOption, noOfUnpaidCampersOption, noOfCampersToPayFor,
  } = await req.body;
  const allocatedRoom = allocateHostels(fullName, age, gender)
  console.log(allocatedRoom)


  // ## Data to be registered
  const userData = { fullName: fullName, email: email, phoneNumber: phoneNumber, gender: gender, age: age, camperType: camperType, denomination: denomination,
  };



//   TRY && CATCH
  try {

    //  ########## Collation of user Info
    if (denomination === "Non-Anglican") {
      camper = await new campersModel({...userData, allocatedRoom: allocatedRoom.data.room});
    } else {
      camper = await new campersModel({
        ...userData,
        archdeaconry: archdeaconry,
        parish: parish,
        allocatedRoom: allocatedRoom.data.room
      });
    }
    //  ########## Collation of user Info


    // ########### Store the User Data in the DB
      await campersModel.create(camper)
        .then(async (d) => {
  
          // // Send This details to the celery worker to send the email
          const task = client.sendTask("tasks.sendRegistrationEmail", [
               {
                    email: d.email,
                    uniqueID: d.uniqueID,
                    fullName: d.fullName,
                    archdeaconry: d.archdeaconry,
                    parish: d.parish,
                    hostel: allocatedRoom.data.room
                 },
            ]);
            task
            .get()
            .then((response) => {
                 console.log(`response from Worker ${response}`);
            })
            .catch((err) => {
                 console.log(`Error in FE fron Worker ${err}`);
            });
            // console.log(`This is the Task ${task}`)
          //   // Send This details to the celery worker to send the email
  
          // res.status(200).json({ message: "Registration Successful", paymentUrl: paymentURL });
          res.status(200).json({ message: "Registration Successful" });
        })
        .catch((err) => {
          throw err;
        });



  } catch (err) {
    const error = errorHandling(err);
    console.log(error)
    res.status(400).json({ errors: error, message: 'Input Errors' });
  }
//   TRY && CATCH


});

module.exports = routes;
