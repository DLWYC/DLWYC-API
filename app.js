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



// # :::::: API ROUTES ::::::
app.use('/api/registration', registration)
app.use('/api/payment', payment)


app.listen(PORT, ()=>{
     console.log(`Connection Successful ${PORT}`)
})

// server.listen(8080, '127.0.0.1', () => {
//      console.log('TCP Server running at http://127.0.0.1:8080/');
//  });