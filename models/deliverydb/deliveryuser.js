// const mongoose = require("mongoose");
// const userSchema = new mongoose.Schema({
//     fullname : {type: String, required: false },
//     phone : {type: String, required: false },
//     otp : {type: String, required: false },
//     activationCode : {type: String, required: false },
//     drivingLicense : {type: String, required: false },
//     vehicleNumber : {type: String, required: false },
//     drivingLicenseImage : {type: String, required: false },
//     userImage : {type: String, required: false },
//     partnerId : {type: String, required: false },
//     expoToken : {type: String, required: false },
//     location : {type: Object, required: false },
// });
const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    fullname : {type: String, required: false },
    phone : {type: String, required: false },
    otp : {type: String, required: false },
    activationCode : {type: String, required: false },
    drivingLicense : {type: String, required: false },
    vehicleNumber : {type: String, required: false },
    drivingLicenseImage : {type: String, required: false },
    userImage : {type: String, required: false },
    partnerId : {type: String, required: false },
    expoToken : {type: String, required: false },
    // location : {type: Object, required: false },
    location: {
        type: {type: String, enum: ["Point"], default: "Point", required: true},
        coordinates: {type: [Number], default: [0, 0], required: true, index: "2dsphere"},
    },
});

module.exports = mongoose.model("deliveryuser", userSchema);