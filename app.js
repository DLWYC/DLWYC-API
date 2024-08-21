require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const PORT = process.env.PORT || 5000
const mongoose = require('mongoose')
const celery = require('celery-node')




// const worker = celery.createWorker("redis://","redis://")

// worker.register('tasks.add', (a, b) => a + b);

// worker.start()





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



// # :::::: API ROUTES ::::::
app.use('/api/registration', registration)



app.listen(PORT, ()=>{
     console.log(`Connection Successful ${PORT}`)
})