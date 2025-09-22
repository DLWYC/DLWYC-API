require("dotenv").config();
const express = require("express");
const routes = express.Router();
const cors = require("cors");
const { userModel } = require("../models/models");
const { errorHandling } = require("../controllers/errorHandler");

routes.get("/", cors(), async (req, res) => {
  try {
    const campers = await userModel.find({});
    res.status(200).json(campers);
  } catch (error) {
    const err = errorHandling(error);
    res.status(400).json({ errors: err });
  }
});

// Marked Attendees
routes.get('/markedAttendees', cors(), async (req, res) => {
  try {
    const totalCampers = await userModel.find({ checkStatus: true });
    res.status(200).json(totalCampers);
  } catch (error) {
    const err = errorHandling(error);
    res.status(400).json({ errors: err });
  }
})


routes.get('/unMarkedAttendees', cors(), async (req, res) => {
  try {
    const totalCampers = await userModel.find({ checkStatus: false });
    res.status(200).json(totalCampers);
  } catch (error) {
    const err = errorHandling(error);
    res.status(400).json({ errors: err });
  }
})

routes.post("/", cors(), async (req, res) => {
  try {
    const camper = await req.body;
    const data = await userModel.findOneAndUpdate(
      { uniqueID: camper.uniqueId },
      { $set: { checkStatus: true } },
      { new: true, upsert: false }
    );
    console.log(camper, data);
    res.status(200).json({ 'message': `${data.uniqueID} Updated Successfully`, 'data': data })
  } catch (error) {
    const err = errorHandling(error);
    res.status(400).json({ errors: err });
  }
});

module.exports = routes;
