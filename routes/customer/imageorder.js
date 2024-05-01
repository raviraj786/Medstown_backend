const express = require("express");
const router = express.Router();
const pharmacydb = require("../../models/pharmacydb/registerpharmacydb.js");
require("dotenv").config();
const axios = require("axios");
const  { Expo } = require("expo-server-sdk");
const pdfairorder = require("../../models/orders/pdfairorder.js");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");

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

// upload pdf and image to s3
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
  }

// create a api to upload pdf and image to s3
router.post("/uploadorder", upload.fields([{ name: "pdf", maxCount: 1 }, { name: "image", maxCount: 1 }]), async (req, res) => {
    await uploadToS3(req.files.pdf[0] || req.files.image[0]).then(async (data) => {
        console.log("https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/"+data.Key);
    });
    res.send("done");
});

module.exports = router;

