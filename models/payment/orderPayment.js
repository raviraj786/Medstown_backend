const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    orderId : {type: String, required: false },
    orderDetails : {type: Array, required: false },
    orderTotal : {type: String, required: false },
    orderStatus : {type: String, required: false },
    orderNature : {type : String , required : false},
    customerId : {type: String, required: false },
    paymentId : {type: String, required: false },
    paymentStatus : {type: String, required: false },
    mobileNumber : {type: String, required: false },
    createdAt: { type: Date, default: Date.now },
   
});

module.exports = mongoose.model("payment", userSchema);