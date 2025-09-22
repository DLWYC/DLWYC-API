const errorHandling = (err) => {
     console.log("Error From Error Handler", err)
     const error = {}

     // Validation Error
     if (err.code === 11000) {
          error['email'] = "This Email Has Been Registered Before"
     }

     switch (true) {
          case err.message.includes('Camper validation failed'):
               Object.values(err.errors).forEach(({ properties }) => {
                    if (properties.message.includes('not a valid enum value')) {
                         error[properties.path] = `Sorry ${properties.value} is not ${properties.path == 'gender' ? 'a' : 'an'} ${properties.path}`
                    } else {
                         error[properties.path] = properties.message
                    }
               })
               break;

          case err.message.includes('Events validation failed'):
               Object.values(err.errors).forEach(({ path, message }) => {
                    error[path] = message;
               });
               break;

          case err.message === "Email is required.":
               error['loginError'] = err.message;
               break;

          case err.message === "Password is required.":
               error['loginError'] = err.message;
               break;

          case err.message === "jwt expired":
               error["jwtError"] = "Your Session Has Expired, Please Login Again";
               break;


          default:
               error['error'] = err.message

     }


     return (error)
}

module.exports = { errorHandling }