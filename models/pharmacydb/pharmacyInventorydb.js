const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    medicineName: {type: String, default: null},
    medicineType: {type: String, default: null},
    medicineCompany: {type: String, default: null},
    medicinePrice: {type: String, default: null},
    medicineQuantity: {type: String, default: null},
    medicineImage: {type: String, default: null},
    medicineLeaf: {type: String, default: null},
    medicineId: {type: String, default: null},
    dateOfRegistration: {type: String, default: null},
    medicineDescription: {type: String, default: null},
    rxRequired: {type: Boolean, default: false},
    disease: {type: String, default: null},
    pharmacyId: {type: String, default: null},
})
module.exports = mongoose.model("pharmacyInventorydb", userSchema);