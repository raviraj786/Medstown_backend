const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  fullname: { type: String, required: false },
  phone: { type: String, unique: true, required: false },
  otp: { type: String, required: false },
  activationCode: { type: String, required: false },
  drivingLicense: { type: String, required: false },
  vehicleNumber: { type: String, required: false },
  date: { type: Date, default: Date.now },

 documnetUploaded : [{
  userImage : {type : String , required : false },
  penCard : {type : String , required : false },
  adharFront : {type : String , required : false},
  adharBack : {type : String , required : false},
  rcFront : {type : String , required : false },
  rcBack : {type : String , required : false },
  drivingLicenseFront : {type : String , required : false },
  drivingLicenseBack : {type : String , required : false },
}],
 

  partnerId: { type: String, required: false },
  expoToken: { type: String, required: false },
  totalBalance: { type: Number, deafult: 0, require: false },
  // location : {type: Object, required: false },
  location: {
    type: { type: String, enum: ["Point"], default: "Point", required: true },
    coordinates: {
      type: [Number],
      default: [0, 0],
      required: true,
      index: "2dsphere",
    },
  },

  BankDetails: {
    bankName: { type: String, default: null },
    accountNumber: { type: String, default: null },
    ifscCode: { type: String, default: null },
    branchName: { type: String, default: null },
    accountHolderName: { type: String, default: null },
  },
  walletHistory: [
    {
      transactionId: { type: String, default: null },
      amount: { type: Number, default: 0 },
      status: { type: String, default: null },
      type: { type: String, default: null },
      date: { type: Date, default: Date.now },
    },
  ],
  wallet: [
    {
      walletBalance: { type: Number, default: 0 },
      date: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("deliveryuser", userSchema);
