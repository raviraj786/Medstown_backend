const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    orderId : {type: String, required: true },
    orderDetails : {type: Array, required: true },
    price : {type: String, required: true },
    quantity : {type: String, required: true },
    customerId : {type: String, required: true },
    pharmacyId : {type: String, required: true },
    orderStatus : {type: String, required: true },
    orderNature : {type : Boolean , required : true , default: false},
    precriptionUrl : {type : String , required : true , default: false},
});

module.exports = mongoose.model("pdfairorder", userSchema);