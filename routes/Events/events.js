const express = require('express')
const router = express.Router()
const { GetLatestEventController } = require('../../controllers/eventsController')

router.get('/latest', GetLatestEventController)


module.exports = router