const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    businessDocumets : {type: Array, default: []},
    pharmacyImage : {type: Array, default: []},
    userDocumets : {type: Array, default: []},
});
const User = mongoose.model("dummydb", userSchema);
module.exports = User;