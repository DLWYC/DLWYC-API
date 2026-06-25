const config = require('../config/index')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const generateRefreshToken = (user) => {
     try {

          const refreshToken = jwt.sign({ uniqueID: user?.uniqueID, role: 'user' }, config.security.jwtSecret, { expiresIn: '7d' })
          return refreshToken
     }
     catch (error) {
          throw new Error({ error: "Error Generating Refresh Token", })
     }
}

const verifyRefreshToken = (token) =>{
     try{
          const decoded = jwt.verify(token, config.security.jwtSecret)
          return decoded
     }
     catch(error){
          throw new Error({ error: "Invalid Refresh Token", })
     }
}

const hashPassword = async (newPassword)=>{
     try{
         const hashedPassword = bcrypt.hash(newPassword, 10)
         return hashedPassword 
     }
     catch(error){
          throw new Error ({error: "Error Encrypting Password"})
     }
}


module.exports = { generateRefreshToken, verifyRefreshToken, hashPassword }