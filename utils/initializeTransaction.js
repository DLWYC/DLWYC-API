const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);

//   paymentData = {
//     email: email,
//     reference: new Date().getTime().toString(),
//     callback_url: "http://localhost:5174/payment/successful",
//   };

//   if (paymentOption === "Multiple") {
//     payStackData = {
//       ...paymentData,
//       amount: (5000 * 100) * noOfCampersToPayFor,
//       metadata: {
//         custom_fields: [
//           {
//             display_name: "Name Of Campers Paid For",
//             variable_name: noOfUnpaidCampersOption,
//           },
//         ],
//       },
//     };
//   }
//   else{
//      payStackData = {...paymentData, amount: 500 * 100};
//   }

//   console.log("Payment" + payStackData.amount)

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