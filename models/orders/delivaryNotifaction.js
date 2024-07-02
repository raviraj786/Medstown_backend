const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  customerId : {type: String, default: null},
  orderDetails : {type: Array, default: []},
  totalPrice : {type: String, default: null},
  quantity : {type: String, default: null},
  pharmacyId : {type: String, default: null},
  orderId : {type: String, default: null},
  status : {type: String, default: "pending"},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deliveryBoyId : {type: String, default: null},
  userLat : {type: String, default: null},
  userLng : {type: String, default: null},
  distance: { type: Number , default: null },
  pharmacyLat : {type: String, default: null},
  pharmacyLng : {type: String, default: null},
  deliveryBoyLat : {type: String, default: null},
  deliveryBoyLng : {type: String, default: null},
});
const orderdb = mongoose.model("delivaryNotifaction", orderSchema);
module.exports = orderdb;