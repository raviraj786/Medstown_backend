const express = require("express");
const router = express.Router();
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
router.post("/registerimages",upload.fields([{ name: 'businessDocumets', maxCount: 3 }, { name: 'pharmacyImage', maxCount: 2 },{ name: 'userDocumets', maxCount: 2 }]), async (req, res ) => {
    let imageurl = [];
    let imageurl1 = [];
    let imageurl2 = [];
    for (let i = 0; i < req.files.businessDocumets.length; i++) {
        await uploadToS3(req.files.businessDocumets[i]).then((data) => {
            imageurl.push("https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/" + data.Key);
        });
    }
    for (let i = 0; i < req.files.pharmacyImage.length; i++) {
        await uploadToS3(req.files.pharmacyImage[i]).then((data) => {
            imageurl1.push("https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/" + data.Key);
        });
    }
    for (let i = 0; i < req.files.userDocumets.length; i++) {
        await uploadToS3(req.files.userDocumets[i]).then((data) => {
            imageurl2.push("https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/" + data.Key);
        });
    }
    const user = new dummydb({
        businessDocumets: imageurl,
        pharmacyImage: imageurl1,
        userDocumets: imageurl2,
    });
    user.save().then((data) => {
        res.status(200).send({ data: data });
    }
    ).catch((err) => {
        res.status(500).send({ message: err.message });
    });
});

module.exports = router;