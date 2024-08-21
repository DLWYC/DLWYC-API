const errorHandling = (err) =>{
     // console.log(err.message, err.code)
     const error = {}
     
     // Validation Error
     if(err.code === 11000){
          error['email'] = "This Email Has Been Registered Before"
     }
     else if(err.message.includes('camper validation failed')){
          Object.values(err.errors).forEach(({properties})=>{
               // # If the error has options
               if(properties.message.includes('not a valid enum value')){
                    error[properties.path] = `Sorry ${properties.value} is not ${properties.path == 'gender' ? 'a' : 'an'} ${properties.path}`
               }
               else{
                    error[properties.path] = properties.message
               }
          })
     }

     // # Other Errors
     else{
          error['error'] = err.message
     }
     return (error)
}

module.exports = { errorHandling }