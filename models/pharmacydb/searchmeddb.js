const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    medicineName: {type: String, default: null},
    medicineId : {type: String, default: null},
    disease: {type: String, default: null},
    type: {type: String, default: null},
});
const searchmeddb = mongoose.model("searchmeddb", userSchema);
module.exports = searchmeddb;