const express = require("express");
const router = express.Router();
const nonprescriptiondb = require("../../models/pharmacydb/nonprescriptiondb.js");
const uuid = require("uuid");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");
const fs = require("fs");
const dummydb = require("../../models/dummydb.js");
var cors = require("cors");
const prescriptiondb = require("../../models/pharmacydb/prescriptiondb.js");
const SearchMedicine = require("../../models/pharmacydb/searchmeddb.js");

router.use(cors());

let upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // no larger than 10mb, you can change as needed.
  },
});
const s3 = new S3({
  endpoint: "https://usc1.contabostorage.com/medstown",
  accessKeyId: "8fe5f069ca4c4b50bd74c7adf18fcf75",
  secretAccessKey: "90ea5d8271241f37b3e248ecee1843ff",
  s3BucketEndpoint: true,
  publicReadAccess: true,
});

const uploadToS3 = (file) => {
  return new Promise((resolve, reject) => {
    const params = {
      Bucket: "medstown",
      Key: file.originalname.replace(/ /g, "_"),
      Body: file.buffer,
      ACL: "public-read",
      ContentDisposition: "inline",
      ContentType: file.mimetype,
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
router.get("/getallmeds", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const search = req.query.search || "";
  try {
    const nonPrescriptionMeds = await nonprescriptiondb
      .find({
        medicineName: { $regex: search, $options: "i" },
      })
      .skip((page - 1) * limit)
      .limit(limit);
    const prescriptionMeds = await prescriptiondb
      .find({
        medicineName: { $regex: search, $options: "i" },
      })
      .skip((page - 1) * limit)
      .limit(limit);
    const allMedicines = [...nonPrescriptionMeds, ...prescriptionMeds];
    const totalCount =
      (await nonprescriptiondb.countDocuments({
        medicineName: { $regex: search, $options: "i" },
      })) +
      (await prescriptiondb.countDocuments({
        medicineName: { $regex: search, $options: "i" },
      }));
    const totalPages = Math.ceil(totalCount / limit);
    res.status(200).json({
      success: true,
      medicines: allMedicines,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medicines",
      error: error.message,
    });
  }
});

// search medicine by elastic search
router.post("/searchmedicine", async (req, res) => {
  try {
    const { search } = req.body;
    const nonPrescriptionMeds = await nonprescriptiondb
      .find({ medicineName: { $regex: search, $options: "i" } })
      .limit(5);
    const prescriptionMeds = await prescriptiondb
      .find({ medicineName: { $regex: search, $options: "i" } })
      .limit(5);
    const combinedResults = [...nonPrescriptionMeds, ...prescriptionMeds];
    res.json(combinedResults);
  } catch (error) {
    console.error("Error occurred during search:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/addmedicine/new", async (req, res) => {
  try {
    const {
      medicineName,
      medicineType,
      medicineCompany,
      medicinePrice,
      medicineQuantity,
      medicineImage,
      dateOfUpdate,
      medicineDescription,
      disease,
      verified,
      type,
    } = req.body;
    let newMedicine;
    if (type === "non-prescription") {
      newMedicine = new nonprescriptiondb({
        medicineName,
        medicineType,
        medicineCompany,
        medicinePrice,
        medicineQuantity,
        medicineImage, // Save S3 URLs to the database
        medicineId: "MED" + uuid.v4(),
        dateOfRegistration: new Date().toLocaleString(),
        dateOfUpdate,
        medicineDescription,
        rxRequired: "false",
        disease,
        verified,
        type: "non-prescription",
      });
    } else {
      newMedicine = new prescriptiondb({
        medicineName,
        medicineType,
        medicineCompany,
        medicinePrice,
        medicineQuantity,
        medicineImage, // Save S3 URLs to the database
        medicineId: "MED" + uuid.v4(),
        dateOfRegistration: new Date().toLocaleString(),
        dateOfUpdate,
        medicineDescription,
        rxRequired: "true",
        disease,
        verified,
        type,
      });
    }
    const savedMedicine = await newMedicine.save();
    const searchMedicine = new SearchMedicine({
      medicineName: savedMedicine.medicineName,
      medicineId: savedMedicine.medicineId,
      disease: savedMedicine.disease,
    });
    await searchMedicine.save();
    res.status(201).json({
      message: "Medicine added successfully",
      medicine: savedMedicine,
    });
  } catch (error) {
    console.error("Error adding medicine:", error);
    res
      .status(500)
      .json({ message: "An error occurred while adding the medicine" });
  }
});

router.post("/updatemedicine", async (req, res) => {
  try {
    const {
      medicineId,
      medicineName,
      medicineType,
      medicineCompany,
      medicinePrice,
      medicineQuantity,
      dateOfUpdate,
      medicineDescription,
      disease,
      verified,
      type,
      medicineImage,
    } = req.body;
    // Find the existing medicine
    let existingMedicine;
    if (type === "non-prescription") {
      existingMedicine = await nonprescriptiondb.findOne({ medicineId });
    } else {
      existingMedicine = await prescriptiondb.findOne({ medicineId });
    }
    if (!existingMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    const updateData = {
      medicineName,
      medicineType,
      medicineCompany,
      medicinePrice,
      medicineQuantity,
      medicineImage,
      dateOfUpdate,
      medicineDescription,
      disease,
      verified,
      type,
    };

    console.log( updateData)

    let updatedMedicine;
    if (type === "non-prescription") {
      updatedMedicine = await nonprescriptiondb.findOneAndUpdate(
        { medicineId },
        updateData,
        { new: true }
      );
    } else {
      updatedMedicine = await prescriptiondb.findOneAndUpdate(
        { medicineId },
        updateData,
        { new: true }
      );
    }

    // Update search index if needed
    await SearchMedicine.findOneAndUpdate(
      { medicineId },
      {
        medicineName: updatedMedicine.medicineName,
        disease: updatedMedicine.disease,
      }
    );
 


    res.status(200).json({
      message: "Medicine updated successfully",
      medicine: updatedMedicine,
    });
  } catch (error) {
    console.error("Error updating medicine:", error);
    res
      .status(500)
      .json({ message: "An error occurred while updating the medicine" });
  }
});





router.delete("/deletemedicine/:medicineId", async (req, res) => {
  try {
    const { medicineId } = req.params;
    if (!medicineId) {
      return res.status(400).json({ message: "Medicine ID is required" });
    }
    const deletedFromNonPrescription = await nonprescriptiondb.findOneAndDelete(
      { medicineId }
    );
    const deletedFromPrescription = await prescriptiondb.findOneAndDelete({
      medicineId,
    });

    if (!deletedFromNonPrescription && !deletedFromPrescription) {
      return res.status(404).json({ message: "Medicine not found" });
    }
    await SearchMedicine.findOneAndDelete({ medicineId });
    res.status(200).json({
      message: "Medicine deleted successfully",
      medicine: deletedFromNonPrescription || deletedFromPrescription,
    });
  } catch (error) {
    console.error("Error deleting medicine:", error);
    res
      .status(500)
      .json({ message: "An error occurred while deleting the medicine" });
  }
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

// get medicine by disease 50 limit and 50 offset
router.post("/getmedsbydisease", async (req, res) => {
  const { disease, offset } = req.body;
  const medicines = await nonprescriptiondb
    .find({ disease: disease })
    .skip(offset)
    .limit(50);
  res.json(medicines);
});
// add new category to medicine
router.post("/addnewcategory", async (req, res) => {
  const { category } = req.body;
  const medicine = await nonprescriptiondb.findOneAndUpdate(
    { medicineId: "MED" + uuid.v4() },
    { $push: { category: category } }
  );
  res.send({
    message: "Category Added Successfully",
    medicine: medicine,
  });
});

// edit category from medicine
router.post("/editcategory", async (req, res) => {
  const { category } = req.body;
  const medicine = await nonprescriptiondb.findOneAndUpdate(
    { medicineId: "MED" + uuid.v4() },
    { $pull: { category: category } }
  );
  res.send({
    message: "Category Edited Successfully",
    medicine: medicine,
  });
});

// update medicine image by medicine id and index
router.post(
  "/updatemedicineimage",
  upload.single("medicineImage"),
  async (req, res) => {
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
  }
);











module.exports = router;
