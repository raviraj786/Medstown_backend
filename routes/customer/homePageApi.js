const express = require("express");
const router = express.Router();
const userdb = require("../../models/customerdb/userdb.js");
const meddb = require("../../models/pharmacydb/medicinedb.js");

router.get("/getmedscategory", async (req, res) => {

    const med = await meddb.find();
    const disease = [];
    for (let i = 0; i < med.length; i++) {
        console.log(med[i]);
        disease.push(med[i].disease);
    }
    // remove duplicates
    const uniqueDisease = [...new Set(disease)];
    res.json(uniqueDisease);
});

module.exports = router;

