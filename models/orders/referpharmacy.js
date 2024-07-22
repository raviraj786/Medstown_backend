const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  customerId : {type: String, default: null},
  pharmacyName : {type: String, default: null},
  pharmacyownername : {type: String, default: null},
  PharmacyMobileNumber : {type: String, default: null},
  PharmacyLocation : {type: String, default: null},
 
});
const orderdb = mongoose.model("referPharmacy", orderSchema);
module.exports = orderdb;