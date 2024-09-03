const express = require("express");
const router = express.Router();
const registerpharmacydb = require("../../models/pharmacydb/registerpharmacydb");
const pharmacydb = require("../../models/pharmacydb/registerpharmacydb");
  



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