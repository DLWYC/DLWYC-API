require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 5000
const mongoose = require('mongoose')


// # :::::: This will allow json data to be passed ::::::
app.use(express.json())
app.use(cors())


// #  :::::: DataBase Initiallization ::::::
mongoose.connect(process.env.DB_URL)
.then(()=>{
     console.log("DataBase Connected Successfully")
})
.catch(err=>{
     console.log(`DataBase Connecection Failed: ${err}`)
})



// # :::::: Routes ::::::
const registration = require('./routes/registration')
const payment = require('./routes/payment')
const unPaidCampers = require('./routes/nonPayers')



// # :::::: API ROUTES ::::::
app.use('/api/registration', registration)
app.use('/api/payment', payment)
app.use('/api/unPaidCampers', unPaidCampers)


app.listen(PORT, ()=>{
     console.log(`Connection Successful ${PORT}`)
})
