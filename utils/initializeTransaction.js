const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);


const initializeTransaction = async (payStackData) =>{
   return await paystack.transaction
          .initialize(payStackData)
          .then((response) => {
            if(response.code === "invalid_email_address"){
              throw ({message: "Invalid Email Address Or No Email Address Passed"})
            }
            return (response);
          })
          .catch((err) => {
            console.log(err);
            return err;
          });
}


module.exports = {initializeTransaction}     