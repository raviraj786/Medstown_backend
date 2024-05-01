const express = require("express");
const router = express.Router();
const nonprescriptiondb = require("../../models/pharmacydb/nonprescriptiondb.js");
const uuid = require("uuid");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const dummydb = require("../../models/dummydb");
var cors = require('cors')
router.use(cors())
let upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // no larger than 10mb, you can change as needed.
    },
});
const s3 = new S3({
  endpoint : "https://usc1.contabostorage.com/medstown",
  accessKeyId: "8fe5f069ca4c4b50bd74c7adf18fcf75",
  secretAccessKey: "90ea5d8271241f37b3e248ecee1843ff",
  s3BucketEndpoint : true,
  publicReadAccess: true,
});

const uploadToS3 = (file) => {
  return new Promise((resolve, reject) => {
      const params = {
          Bucket: "medstown",
          Key: file.originalname.replace(/ /g,"_"),
          Body: file.buffer,
          ACL : "public-read",
          ContentDisposition: "inline",
          ContentType : file.mimetype,
      };
      s3.upload(params, (err, data) => {
          if (err) {
              reject(err);
          }
          resolve(data);
      });
  });
};
// get hundred medicines from database and then set 100 ofset and limit to 100

router.post("/getallmeds", async (req, res) => {
  const { offset } = req.body;
  const medicines = await nonprescriptiondb.find().skip(offset).limit(50);
  res.json(medicines);
});
// search medicine by elastic search
router.post("/searchmeds", async (req, res) => {
  const { search } = req.body;
  const medicines = await nonprescriptiondb
    .find({ medicineName: { $regex: search, $options: "i" } })
    .limit(5);
  res.json(medicines);
});
// get medicine by id
router.post("/getmedbyid", async (req, res) => {
  const { id } = req.body;
  const medicine = await nonprescriptiondb.findById(id);
  res.json(medicine);
});
router.post("/filtermedsbydisease", async (req, res) => {
  const { disease } = req.body;
  const medicines = await nonprescriptiondb
    .find({ disease: { $regex: disease, $options: "i" } })
    .limit(5);
  res.json(medicines);
});
// get disease list
router.get("/getdiseaselist", async (req, res) => {
  const diseases = await nonprescriptiondb.find().distinct("disease");
  res.json(diseases);
});
// disease wise medicine count for all diseases in database
router.get("/getmedcountbydisease", async (req, res) => {
  console.log("getmedcountbydisease");
  const medicines = await nonprescriptiondb.aggregate([
    {
      $group: {
        _id: "$disease",
        count: { $sum: 1 },
      },
    },
  ]);
  res.json(medicines);
});
router.post("/editmedicine", async (req, res) => {
  const {
    medicineName,
    medicineType,
    medicineCompany,
    medicinePrice,
    medicineQuantity,
    medicineLeaf,
    medicineId,
    dateOfRegistration,
    dateOfUpdate,
    medicineDescription,
    rxRequired,
    disease,
    verified,
    type,
  } = req.body;
  const medicine = await nonprescriptiondb.findOneAndUpdate(
    { medicineId: medicineId },
    {
      medicineName: medicineName,
      medicineType: medicineType,
      medicineCompany: medicineCompany,
      medicinePrice: medicinePrice,
      medicineQuantity: medicineQuantity,
      medicineLeaf: medicineLeaf,
      dateOfRegistration: dateOfRegistration,
      dateOfUpdate: dateOfUpdate,
      medicineDescription: medicineDescription,
      rxRequired: rxRequired,
      disease: disease,
      verified: verified,
      type: type,
    }
  );
  res.send({
    message: "Medicine Updated Successfully",
    medicine: medicine,
  });
});
// get medicine by disease 50 limit and 50 offset
router.post("/getmedsbydisease", async (req, res) => {
  const { disease, offset } = req.body;
  const medicines = await nonprescriptiondb.find({ disease: disease }).skip(offset).limit(50);
  res.json(medicines);
});
// add new category to medicine
router.post("/addnewcategory", async (req, res) => {
  const {category } = req.body;
  const medicine = await nonprescriptiondb.findOneAndUpdate(
    { medicineId: 'MED' + uuid.v4() },
    { $push: { category: category } }
  );
  res.send({
    message: "Category Added Successfully",
    medicine: medicine,
  });
});
// delete category from medicine
router.post("/deletecategory", async (req, res) => {
  const { category } = req.body;
  const medicine = await nonprescriptiondb.findOneAndUpdate(
    { medicineId: 'MED' + uuid.v4() },
    { $pull: { category: category } }
  );
  res.send({
    message: "Category Deleted Successfully",
    medicine: medicine,
  });
});
// edit category from medicine
router.post("/editcategory", async (req, res) => {
  const { category } = req.body;
  const medicine = await nonprescriptiondb.findOneAndUpdate(
    { medicineId: 'MED' + uuid.v4() },
    { $pull: { category: category } }
  );
  res.send({
    message: "Category Edited Successfully",
    medicine: medicine,
  });
});
router.post("/deletemedicineimage", async (req, res) => {
  const { medicineId, index } = req.body;
  const medicine = await nonprescriptiondb.findOneAndUpdate(
    { medicineId: medicineId },
    { $pull: { medicineImage: { $in: [medicineId[index]] } } }
  );
  res.send({
    message: "Medicine Image Deleted Successfully",
    medicine: medicine,
  });
});
// update medicine image by medicine id and index
router.post("/updatemedicineimage", upload.single("medicineImage"), async (req, res) => {
  const { medicineId, index } = req.body;
  const file = req.file;
  const medicine = await nonprescriptiondb.findOneAndUpdate(
    { medicineId: medicineId },
    { $set: { medicineImage: { $in: [medicineId[index]] } } }
  );
  res.send({
    message: "Medicine Image Updated Successfully",
    medicine: medicine,
  });
});
module.exports = router;
