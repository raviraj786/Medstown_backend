const express = require("express");
const router = express.Router();
const Medicinedb = require("../../models/pharmacydb/medicinedb.js");
const searchmeddb = require("../../models/pharmacydb/searchmeddb.js");

// fetch random medicine from a disease whose verify status is false
router.post("/getrandommedicine", async (req, res) => {
  try {
    const disease = req.body.disease;
    const medicine = await Medicinedb.aggregate([
      { $match: { disease: disease, verified: false } },
      { $sample: { size: 1 } },
    ]);
    res.send(medicine);
  } catch (err) {
    res.status(400).send;
  }
});

router.post("/deletemedicineimage/:id", async (req, res) => {
  try {
    const medicine = await Medicinedb.findOne({ medicineId: req.params.id });
    const medicineImage = medicine.medicineImage;
    const index = req.body.index;
    medicineImage.splice(index, 1);
    const updatedMedicine = await Medicinedb.updateOne(
      { medicineId: req.params.id },
      { $set: { medicineImage: medicineImage } }
    );
    res.send({
      status: "success",
      message: "Medicine image deleted successfully",
    });
  } catch (err) {
    res.send(err);
  }
});
// update the mecine data and verify status to true
router.post("/editmedicine/:id", async (req, res) => {
  const {
    medicineName,
    medicineType,
    medicineCompany,
    medicinePrice,
    medicineQuantity,
    medicineLeaf,
    medicineDescription,
    rxRequired,
    disease,
  } = req.body;
  try {
    const updatedMedicine = await Medicinedb.updateOne(
      { medicineId: req.params.id },
      {
        $set: {
          medicineName: medicineName,
          medicineType: medicineType,
          medicineCompany: medicineCompany,
          medicinePrice: medicinePrice,
          medicineQuantity: medicineQuantity,
          medicineLeaf: medicineLeaf,
          medicineDescription: medicineDescription,
          rxRequired: rxRequired,
          disease: disease,
          verified: true,
          dateOfUpdate: new Date().toLocaleString(),
        },
      }
    );
    const searchmed = new searchmeddb({
      medicineName: medicineName,
      medicineId: req.params.id,
      disease: disease,
    });
    const searchMed = await searchmed.save();
    res.send({
      status: "success",
      message: "Medicine updated successfully",
    });
  } catch (err) {
    res.status(400).send(err);
  }
});
// // update the medicinedb with verified status as false to whole database
// router.get("/verifyallmedicine", async (req, res) => {
//     try {
//         const updatedMedicine = await Medicinedb.updateMany(
//             {},
//             { $set: { verified: false } }
//         );
//         res.send({
//             status: "success",
//             message: "Medicine verified successfully",
//         });
//     }
//     catch (err) {
//         res.status(400).send(err);
//     }
// });

module.exports = router;
