const Prescriptiondb = require("../models/pharmacydb/prescriptiondb.js");
const searchmeddb = require("../models/pharmacydb/searchmeddb.js");
const express = require("express");
const router = express.Router();


// get medicineId , disease , medicineName , rxRequired  from prescriptiondb

router.get("/getallprescription", async (req, res) => {
    try {
        console.log("api called");
        let prescription = await Prescriptiondb.find({}, { medicineId: 1, disease: 1, medicineName: 1, rxRequired: 1 });
        if(prescription){
            // store all the data in searchmeddb
            let data = []
            prescription.forEach(async (element) => {
                let searchmed = new searchmeddb({
                    medicineName: element.medicineName,
                    medicineId: element.medicineId,
                    disease: element.disease,
                    type: "prescription",
                });
                data.push(searchmed);
            });
            await searchmeddb.insertMany(data);
            res.status(200).send({ msg: "Success" });
        }
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching medicine" });
    }
});

//delete disease which is null
router.get("/deletenull", async (req, res) => {
    try {
        let prescription = await searchmeddb.deleteMany({ disease: null });
        res.status(200).send({ msg: "Success" });
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while deleting medicine" });
    }
});


module.exports = router;