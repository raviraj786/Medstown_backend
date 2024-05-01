const express = require("express");
const router = express.Router();
const pharmacyInventorydb = require("../../models/pharmacydb/pharmacyInventorydb.js");

router.post("/addmedicineinventory", async (req, res) => {
    const { medicineName, medicineType, medicineCompany, medicinePrice, medicineQuantity, medicineImage, medicineLeaf, medicineId, medicineDescription, rxRequired, disease, pharmacyId } = req.body;
    const medicine = new pharmacyInventorydb({
        medicineName: medicineName,
        medicineType: medicineType,
        medicineCompany: medicineCompany,
        medicinePrice: medicinePrice,
        medicineQuantity: medicineQuantity,
        medicineImage: medicineImage,
        medicineLeaf: medicineLeaf,
        medicineId: medicineId,
        dateOfRegistration: new Date().toLocaleString(),
        medicineDescription: medicineDescription,
        rxRequired: rxRequired,
        disease: disease,
        pharmacyId: pharmacyId,
    });
    try {
        const savedMedicine = await medicine.save();
        res.send({
            status: true,
            message: "Medicine added to inventory successfully",
        });
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: "Something went wrong while adding medicine to inventory",
        });
    }
});
// get all medicine by pharmacyId
router.get("/getallmedicineinventory/:id", async (req, res) => {
    try {
        const medicine = await pharmacyInventorydb.find({ pharmacyId: req.params.id });
        res.send(medicine);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching medicine" });
    }
});
// update medicine by medicineId and pharmacyId
router.post("/updatemedicineinventory", async (req, res) => {
    const { medicineName, medicineType, medicineCompany, medicinePrice, medicineQuantity, medicineImage, medicineLeaf, medicineId, medicineDescription, rxRequired, disease, pharmacyId } = req.body;
    try {
        const medicine = await pharmacyInventorydb.findOneAndUpdate({ medicineId: medicineId, pharmacyId: pharmacyId }, {
            medicineName: medicineName,
            medicineType: medicineType,
            medicineCompany: medicineCompany,
            medicinePrice: medicinePrice,
            medicineQuantity: medicineQuantity,
            medicineImage: medicineImage,
            medicineLeaf: medicineLeaf,
            medicineId: medicineId,
            dateOfUpdate: new Date().toLocaleString(),
            medicineDescription: medicineDescription,
            rxRequired: rxRequired,
            disease: disease,
            pharmacyId: pharmacyId,
        });
        res.send({
            status: true,
            message: "Medicine updated successfully",
        });
    }
    catch (err) {
        res.status(400).send({
            status: false,
            message: "Something went wrong while updating medicine",
        });
    }
});



module.exports = router;

