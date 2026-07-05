const { EventModel } = require('../models/events');

const GetLatestEventController = async (req, res) => {
     try {
          const latestEvent = await EventModel.find().sort({ eventDate: -1 }).limit(3).lean();
          // const
          return res.status(200).json({ message: "Latest Event Retrieved Successfully", latestEvent });
     }
     catch (error) {
          logger.error(`Error fetching Events ${error}`)
          return res.status(500).json({ message: "Error fetching events" });
     }
}


module.exports = { GetLatestEventController }