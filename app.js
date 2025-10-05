require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 5000
const mongoose = require('mongoose')
const authMiddlware = require('./middleware/auth')

// # :::::: This will allow json data to be passed ::::::
app.use(express.json())
app.use(cors())


// #  :::::: DataBase Initiallization ::::::
mongoose.connect(process.env.DB_URL)
     .then(() => {
          console.log("DataBase Connected Successfully")
     })
     .catch(err => {
          console.log(`DataBase Connecection Failed: ${err}`)
     })



// # :::::: Routes ::::::
const userRegistration = require('./routes/UserRoute/userRegistration')
const userDashboard = require('./routes/UserRoute/userDashboard')
const userLogin = require('./routes/UserRoute/userLogin')
const userRegisteredEvents = require('./routes/UserRoute/userRegisteredEvent')
const verifyUserPayment = require('./routes/payment')

// ADMIN
const event = require('./routes/AdminRoute/events')



// const unPaidCampers = require('./routes/nonPayers')
// const attendees = require('./routes/attendee')

// const dashboardRegister = require('./routes/dashboardRegister')




// #::::::::::::::::::::::::::::::::::::::: USER API ENDPOINT :::::::::::::::::::::::::# //
app.use('/api/userRegistration', cors(), userRegistration)
app.use('/api/userLogin', cors(), userLogin)
app.use('/api/userDashboard', cors(), authMiddlware, userDashboard)
app.use('/api/userRegisteredEvents', cors(), userRegisteredEvents)
app.use('/api/payment', cors(), verifyUserPayment)

// ADMIN
app.use('/api/admin/events', event)


// app.use('/api/unPaidCampers', unPaidCampers)
// app.use('/api/attendees', attendees)

// Login
// app.use('/api/dashboard/register', dashboardRegister)
// app.use('/api/dashboard/login', login)

app.listen(PORT, () => {
     console.log(`Connection Successful ${PORT}`)
})
