const mongoose =  require('mongoose');
const config = require('./index.js');

const connectDB = async () =>{
     console.log("Connecting to Database...")
     try{
          await mongoose.connect(config.db.url, {
               maxPoolSize: 10,
               minPoolSize: 3,
               serverSelectionTimeoutMS: 5000,
               heartbeatFrequencyMS: 10000,
          })
          console.log("Connected to Database")
     }
     catch(err){
          throw new Error(`CRITICAL: Failed to connect to the database. ${err.message}`);
     }
}

module.exports = connectDB;