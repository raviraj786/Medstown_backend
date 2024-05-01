const express = require("express");
const router = express.Router();
const Nonprescriptiondb = require("../../models/pharmacydb/nonprescriptiondb.js");
const Prescriptiondb = require("../../models/pharmacydb/prescriptiondb.js");

// get all disease from nonprescriptiondb unique
// remove document with null disease

router.get("/removenulldisease", async (req, res) => {
    try {
        const disease = await Nonprescriptiondb.deleteMany({ disease: null });
        res.send(disease);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching disease" });
    }
});


router.get("/getallcategory", async (req, res) => {
    try {
        const disease = await Nonprescriptiondb.find({}).distinct("disease");
        // append a image url to disease
        const diseaseWithImageUrl = disease.map((disease) => {
            return {
                disease,
                imageUrl: `https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstowninternal/category.png`
            }
        }
        );
        res.send(diseaseWithImageUrl);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching disease" });
    }
});
// disease wise medicine count for graph
router.get("/getallcategorypres", async (req, res) => {
    try {
        const disease = await Prescriptiondb.find({}).distinct("disease");
        // append a image url to disease
        const diseaseWithImageUrl = disease.map((disease) => {
            return {
                disease,
                imageUrl: `https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstowninternal/category.png`
            }
        }
        );
        res.send(diseaseWithImageUrl);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching disease" });
    }
});
//delete medicine whose disease is null
router.get("/deletediseasenull", async (req, res) => {
    try {
        const disease = await Prescriptiondb.deleteMany({ disease: null });
        res.send(disease);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching disease" });
    }
});

router.get("/getdiseasewisemedicinecount", async (req, res) => {
    try {
        const disease = await Nonprescriptiondb.aggregate([
            {
                $group: {
                    _id: "$disease",
                    count: { $sum: 1 }
                }
            }
        ]);
        res.send(disease);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching disease" });
    }
});

module.exports = router;