const jwt = require('jsonwebtoken')

const generateToken = (data, secretKey, maxTime) =>{
     const token = jwt.sign(data, secretKey, {expiresIn: maxTime})
     return(token)
}

module.exports = {generateToken}