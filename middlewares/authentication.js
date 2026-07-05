const jwt = require('jsonwebtoken');
const config = require('../config/index');
const logger = require('../config/logger');


const authenticateToken = (req,res,next) =>{
     const token = req.cookies.accessToken

     // Check if the token exist
     if(!token){
          logger.error( `Access Denied: No Token Provided`)
          return res.status(401).json({ message: 'Access Denied: No Token Provided' })
     }

     try{
          const decoded = jwt.verify(token, config.security.jwtSecret)
          req.user = decoded
          console.log("Decoded Token", decoded)
          next()
     }
     catch(error){
          logger.error(`Invalid Token: ${error.message}`)
          return res.status(403).json({ message: 'Invalid Token' })
     }
}

module.exports = authenticateToken