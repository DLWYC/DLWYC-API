const errorHandler = async function (error) {
     const errorTypes = {
          user: "user validation failed"
     }
     const errors = {}


     switch (true) {
          case error.message.includes(errorTypes.user):
               Object.values(error.errors).forEach(({ path, message }) => {
                    errors[path] = message
               })
               break;
     }
     return errors
}


module.exports = { errorHandler }