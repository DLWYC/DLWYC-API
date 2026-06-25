require ('./config/instrument.js'); // Sentry instrumentation

const express = require('express');
const helmet = require('helmet');  
const cors =  require('cors');
const cookieParser = require('cookie-parser')

const config =  require('./config/index.js');
const connectDB = require('./config/database.js');
const logger = require('./config/logger.js');
const corsOption = require('./config/cors.js');


const app = express();
app.use(helmet());
app.use(cors(corsOption));
app.use(express.json())
app.use(cookieParser())

const PORT = config.port


// Routes
const authenticationRoutes = require('./routes/User/authentication.js');


app.use('/api/auth', authenticationRoutes);


app.get("/health", (req, res) =>
  res.json({ ok: true, uptime: process.uptime(), dbState: mongoose.connection.readyState })
);


async function startServer () {
     try{
          await connectDB();
          logger.info("Database Connected Successfully")
          app.listen(PORT, "0.0.0.0", () => logger.info(`Server running on port ${PORT}`));
     }
     catch(error){
          logger.fatal("Failed to start server", error)
     }
 }

 startServer()