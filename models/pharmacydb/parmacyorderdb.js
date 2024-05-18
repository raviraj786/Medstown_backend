const mongoose = require("mongoose");
const OrderSchema = mongoose.Schema({
  pharmacyId: { type: String, required: true },
  acceptedOrders: [
    {
      orderDetails: [],
      orderId: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
  rejectedOrders: [
    {
      orderDetails: [],
      orderId: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
  orders: [
    {
      orderDetails: [],
      orderId: { type: String },
      date: { type: Date, default: Date.now },
    },
  ],
  totalBalance: { type: Number, default: 0 },
  walletHistory: [
    {
      transactionId: { type: String, default: null },
      amount: { type: Number, default: 0 },
      status: { type: String, default: null },
      type: { type: String, default: null },
      date: { type: Date, deafault: Date.now },
    },
  ],
});
module.exports = PharmacyOrders = mongoose.model("PharmacyOrder", OrderSchema);
