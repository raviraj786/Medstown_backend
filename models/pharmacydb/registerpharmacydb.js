const mongoose = require("mongoose");
const orders = { order: {type: Array, default: []}, date: {type: String, default: null} };
const acceptedOrders = { order: {type: Array, default: []}, date: {type: String, default: null} };
const rejectedOrders = { order: {type: Array, default: []}, date: {type: String, default: null} };
const missedOrders = { order: {type: Array, default: []}, date: {type: String, default: null} };

const BankDetails = {
    bankName: {type: String, default: null},
    accountNumber: {type: String, default: null},
    ifscCode: {type: String, default: null},
    bankName: {type: String, default: null},
    branchName: {type: String, default: null},
    accountHolderName: {type: String, default: null},
};
const walletHistory = [{
    transactionId: {type: String, default: null},
    amount: {type: Number, default: 0},
    status: {type: String, default: null},
    type: {type: String, default: null},
    date: {type: String, default: null},
}];

const wallet = [{
    walletBalance: {type: Number, default: 0},
    walletHistory: {type: walletHistory, default: walletHistory},
}];
const userSchema = new mongoose.Schema({
    fullName: {type: String, default: null},
    bussinessName: {type: String, default: null},
    bussinessRegNo: {type: String, default: null},
    gstNo: {type: String, default: null},
    medicalLicenseNo: {type: String, default: null},
    address: {type: String, default: null},
    pincode: {type: String, default: null},
    businessDocumets: {type: Array, default: []},
    userDocumets: {type: Array, default: []},
    businessPhone: {type: String, default: null},
    ownerPhone: {type: String, default: null},
    email: {type: String, default: null},
    password: {type: String, default: null},
    otp: {type: String, default: null},
    dateOfRegistration: {type: String, default: null},
    dateOfMedicalLicense: {type: String, default: null},
    pharmacyId: {type: String, default: null},
    pharmacyUserId: {type: String, default: null},
    businessTiming: {type: Array, default: []},
    pharmacyImage: {type: Array, default: []},
    medicineLeaf: {type: String, default: null},
    medicineInventory: {type: Array, default: []},
    orders: {type: orders, default: orders},
    acceptedOrders: {type: acceptedOrders, default: acceptedOrders},
    rejectedOrders: {type: rejectedOrders, default: rejectedOrders},
    missedOrders: {type: missedOrders, default: missedOrders},
    otpVerified: {type: Boolean, default: false},
    location: {
        type: {type: String, enum: ["Point"], default: "Point", required: true},
        coordinates: {type: [Number], default: [0, 0], required: true, index: "2dsphere"},
    },
    expoToken: {type: String, default: null},
    bankDetails: {type: BankDetails, default: null},
    wallet: {type: wallet, default: null},
});
const pharmacydb = mongoose.model("pharmacydb", userSchema);
module.exports = pharmacydb;