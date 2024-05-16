const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  customerId : {type: String,   default: null},
  totalPrice : {type: String, default: null},
  pharmacyId : {type: String, default: null},
  orderId : {type: String,    default: null ,  unique: true},
  status : {type: String, default: "pending"},
  deliveryBoyId : {type: String, default: null},
  otpValue :{type : String , default: null},
  paymentType : {type : String , default : null},
  deliveryPrice : {type : String , default : null},
  createdAt: { type: Date, default: Date.now },

});

const orderdb = mongoose.model("finalorder", orderSchema);

module.exports = orderdb;

