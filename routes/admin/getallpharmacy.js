const express = require("express");
const router = express.Router();
const registerpharmacydb = require("../../models/pharmacydb/registerpharmacydb");
// fullName: {type: String, default: null},
//     bussinessName: {type: String, default: null},
//     bussinessRegNo: {type: String, default: null},
//     gstNo: {type: String, default: null},
//     medicalLicenseNo: {type: String, default: null},
//     address: {type: String, default: null},
//     pincode: {type: String, default: null},
//     businessDocumets: {type: Array, default: []},
//     userDocumets: {type: Array, default: []},
//     businessPhone: {type: String, default: null},
//     ownerPhone: {type: String, default: null},
//     email: {type: String, default: null},
//     password: {type: String, default: null},
//     otp: {type: String, default: null},
//     dateOfRegistration: {type: String, default: null},
//     dateOfMedicalLicense: {type: String, default: null},
//     pharmacyId: {type: String, default: null},
//     pharmacyUserId: {type: String, default: null},
//     businessTiming: {type: Array, default: []},
//     pharmacyImage: {type: Array, default: []},
//     medicineLeaf: {type: String, default: null},
//     medicineInventory: {type: Array, default: []},
//     orders: {type: orders, default: orders},
//     acceptedOrders: {type: acceptedOrders, default: acceptedOrders},
//     rejectedOrders: {type: rejectedOrders, default: rejectedOrders},
//     missedOrders: {type: missedOrders, default: missedOrders},
//     location: {
//         type: {type: String, enum: ["Point"], default: "Point", required: true},
//         coordinates: {type: [Number], default: [0, 0], required: true},
//     },

// get hundred medicines from database and then set 100 ofset and limit to 100

router.post("/getallpharmacy", async (req, res) => {
    const { offset } = req.body;
    const pharmacies = await registerpharmacydb.find().skip(offset).limit(100);
    res.json(pharmacies);
});
// get all pharmacies
router.get("/getallpharmacies", async (req, res) => {
    const pharmacies = await registerpharmacydb.find();
    res.json(pharmacies);
});
// edit pharmacy
router.post("/editpharmacy", async (req, res) => {
    const {pharmacyId,fullName, bussinessName, bussinessRegNo, gstNo, medicalLicenseNo, address, pincode, businessPhone, ownerPhone, email, dateOfRegistration, dateOfMedicalLicense, businessTiming, location } = req.body;
    registerpharmacydb.findOneAndUpdate({pharmacyId: pharmacyId}, {fullName: fullName, bussinessName: bussinessName, bussinessRegNo: bussinessRegNo, gstNo: gstNo, medicalLicenseNo: medicalLicenseNo, address: address, pincode: pincode, businessPhone: businessPhone, ownerPhone: ownerPhone, email: email, dateOfRegistration: dateOfRegistration, dateOfMedicalLicense: dateOfMedicalLicense, businessTiming: businessTiming, location: location}, (err, data) => {
        if(err){
            res.json({message: "Error"});
        }else{
            res.json({message: "Success"});
        }
    });
});
// delete pharmacy by pharmacyId
router.post("/deletepharmacy", async (req, res) => {
    const {pharmacyId} = req.body;
    registerpharmacydb.findOneAndDelete({pharmacyId: pharmacyId}, (err, data) => {
        if(err){
            res.json({message: "Error"});
        }else{
            res.json({message: "Success"});
        }
    });
});

module.exports = router;