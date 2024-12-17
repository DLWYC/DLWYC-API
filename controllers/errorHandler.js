const errorHandling = (err) =>{
     console.log("wewe", err)
     const error = {}
     
     // Validation Error
     if(err.code === 11000){
          error['email'] = "This Email Has Been Registered Before"
     }
     if (err.message === "Email is required.") {
        error['email'] = err.message;
    } else if (err.message === "Password is required.") {
        error['password'] = err.message;
    }
     else if(err.message.includes('camper validation failed')){
          Object.values(err.errors).forEach(({properties})=>{
               // # If the error has options
               // console.log(properties.message);
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