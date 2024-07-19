const mongoose = require("mongoose");
const { number } = require("yup");

const orderSchema = new mongoose.Schema({
  orderId: { type: String, default: null },
  status: { type: String, default: null },
  paymentType: { type: String, default: null },
  totalPrice: { type: String, default: null },
  otpValue: { type: String, default: null },
  orderDetails: { type: Array, default: [] },
  precriptionUrl : {type : String , required : true , default: false},
  customerId: { type: String, default: null },
  customerName: { type: String, default: null },
  customerPhone: { type: String, default: null },
  userLat: { type: String, default: null },
  userLng: { type: String, default: null },
  pharmacyId: { type: String, default: null },
  pharmacyName: { type: String, default: null },
  pharmacyPhone: { type: String, default: null },
  pharmacyPrice : {type : String ,defalt : null},
  pharmacyLat: { type: String, default: null },
  pharmacyLng: { type: String, default: null },
  deliveryBoyId: { type: String, default: null },
  deliveryBoyName: { type: String, default: null },
  deliveryBoyPhone: { type: String, default: null },
  deliveryPrice: { type: String, default: null },
  deliveryBoyLat: { type: String, default: null },
  deliveryBoyLng: { type: String, default: null },
  phamacydistance: { type: Number , default: null },
  distance: { type: Number , default: null },
  createdAt: { type: Date, default: Date.now }
});

const orderdb = mongoose.model("finalorder", orderSchema);

module.exports = orderdb;