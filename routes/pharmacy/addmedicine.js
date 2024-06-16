const express = require("express");
const router = express.Router();
const Medicinedb = require("../../models/pharmacydb/medicinedb.js");
const nonprescriptiondb = require("../../models/pharmacydb/nonprescriptiondb.js");
const Prescriptiondb = require("../../models/pharmacydb/prescriptiondb.js");
const Diseasedb = require("../../models/pharmacydb/diseasedb.js");
const uuid = require("uuid")
const searchmeddb = require("../../models/pharmacydb/searchmeddb.js");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");
const verifydb = require("../../models/pharmacydb/verifydb.js");

router.post("/addmedicine", async (req, res) => {
    const { medicineName, medicineType, medicineCompany, medicinePrice, medicineQuantity, medicineImage, medicineLeaf, medicineDescription, rxRequired, disease } = req.body;
    const medicine = new Medicinedb({
        medicineName: medicineName,
        medicineType: medicineType,
        medicineCompany: medicineCompany,
        medicinePrice: medicinePrice,
        medicineQuantity: medicineQuantity,
        medicineImage: medicineImage,
        medicineLeaf: medicineLeaf,
        medicineId: 'MED' + uuid.v4(),
        dateOfRegistration: new Date().toLocaleString(),
        medicineDescription: medicineDescription,
        rxRequired: rxRequired,
        disease: disease,
    });
    try {
        const savedMedicine = await medicine.save();
        const searchmed = new searchmeddb({
            medicineName: medicineName,
            medicineId: savedMedicine.medicineId,
            disease: disease,
        });
        const searchMed = await searchmed.save();
        res.send({
            status: "success",
            message: "Medicine added successfully",
            medicineId: savedMedicine.medicineId,
        });
    }
    catch (err) {
        res.status(400).send(err);
    }
});
router.get("/getallmedicine", async (req, res) => {
    try {
        const medicine = await Medicinedb.find();
        res.send(medicine);
    }
    catch (err) {
        res
            .status(400)
            .send({ msg: "Something went wrong while fetching medicine" });
    }
});
router.get("/getmedicinebyid/:id/:db", async (req, res) => {
    try {
        if(req.params.db=="prescription")
        {
            const medicine = await Prescriptiondb.findOne({ medicineId: req.params.id });
            res.send(medicine);
        }
        else if(req.params.db=="nonprescription")
        {
            const medicine = await nonprescriptiondb.findById(req.params.id);
            res.send(medicine);
        }
        else{
            const medicine = await Medicinedb.findOne({ medicineId: req.params.id });
            res.send(medicine);
        }
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching medicine" });
    }
});
// get medicine by disease
router.get("/getmedicinebydisease/:disease", async (req, res) => {
    try {
        const medicine = await nonprescriptiondb.find({ disease: req.params.disease });
        res.send(medicine);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching medicine" });
    }
});
router.get("/getmedicinebydiseasepage/:disease/:page", async (req, res) => {
    try {
        const [nonPrescriptionMeds, prescriptionMeds] = await  Promise.all([
            nonprescriptiondb.find({ disease: req.params.disease }).skip((req.params.page - 1) * 20).limit(20),
            Prescriptiondb.find({disease : req.params.disease}).skip((req.params.page - 1) * 20).limit(20)
        ])  
        res.send(
            {
                nonPrescriptionMeds, prescriptionMeds
            }
        );
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching medicine" });
    }
});









router.get("/getmedicinebydisease/:disease/:page", async (req, res) => {});

router.get("/getmedicinebysearch/:search", async (req, res) => {
    try {
        const medicine = await Medicinedb.find({ medicineName: { $regex: req.params.search, $options: "i" } });
        res.send(medicine);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching medicine" });
    }
});
router.get("/searchmedicine/:search", async (req, res) => {
    try {
        const medicine = await searchmeddb.find({ medicineName: { $regex: req.params.search, $options: "i" } }).limit(10);
        res.send(medicine);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching medicine" });
    }
});
// search medicine of a disease
router.get("/searchmedicinedisease/:disease/:search", async (req, res) => {
    try {
        const medicine = await searchmeddb.find({ disease: req.params.disease, medicineName: { $regex: req.params.search, $options: "i" } }).limit(10);
        res.send(medicine);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching medicine" });
    }
});
// add medicine to searchmeddb
router.post("/addsearchmedicine", async (req, res) => {
    const { medicineName, medicineId, disease,type } = req.body;
    const searchmed = new searchmeddb({
        medicineName: medicineName,
        medicineId: medicineId,
        disease: disease,
        type:type
    });
    try {
        const savedMedicine = await searchmed.save();
        res.send({
            status: "success",
            message: "Medicine added successfully",
        });
    }
    catch (err) {
        res.status(400).send(err);
    }
});
// ********** disease.js **********
router.post("/adddisease", async (req, res) => {
    const { diseaseName, diseaseID } = req.body;
    const disease = new Diseasedb({
        diseaseName: diseaseName,
        diseaseID: diseaseID,
    });
    try {
        const savedDisease = await disease.save();
        res.send(savedDisease);
    }
    catch (err) {
        res.status(400).send(err);
    }
});
router.get("/getalldisease", async (req, res) => {
    try {
        const disease = await Diseasedb.find();
        res.send(disease);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching disease" });
    }
});
router.get("/getdiseasebyid/:id", async (req, res) => {
    try {
        const disease = await Diseasedb.findOne({ diseaseID: req.params.id });
        res.send(disease);
    }
    catch (err) {
        res.status(400).send({ msg: "Something went wrong while fetching disease" });
    }
});
// ********** add image db **********
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
// upload medicine image using medicine id
router.post("/uploadmedicineimage/:id", upload.fields([{ name: "medicineImage",maxCount:4 }]), async (req, res) => {
    const medicineId = req.params.id;
    const imageurl = [];
    for(let i=0;i<req.files.medicineImage.length;i++){
        await uploadToS3(req.files.medicineImage[i]).then((data) => {
        imageurl.push("https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/"+data.Key);
        });
    }
    // push image url to medicine image array
    try {
        const medicine = await Medicinedb.findOne
            ({ medicineId: medicineId });
        medicine.medicineImage.push(...imageurl);
        const savedMedicine = await medicine.save();
        res.send({
            status: "success",
            message: "Medicine image added successfully",
            medicineId: savedMedicine.medicineId,
        });
    }
    catch (err) {
        res.status(400).send(err);
    }
});


module.exports = router;