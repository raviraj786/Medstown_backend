const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    diseaseName: {type: String, default: null},
    diseaseID: {type: String, default: null},
});
module.exports = mongoose.model("Diseasedb", userSchema);