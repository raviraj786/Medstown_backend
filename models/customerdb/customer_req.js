const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    fullName: {type: String, required: true },
    phone: {type: String, required: true },
    email: {type: String, required: true },
    patientDetails:{type:Array, default:[]},
    userId: {type: String, required: true },
    otp: {type: String, default: null}, 
    userType: {type: String, default: "customer"},
    profilePic: {type: String, default: null},
    prescription: {type: Array, default: []},
});
module.exports = mongoose.model("customer_requst", userSchema);