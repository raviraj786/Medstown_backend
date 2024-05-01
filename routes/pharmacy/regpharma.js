const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pharmacydb = require("../../models/pharmacydb/registerpharmacydb.js");
const uuid = require("uuid");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");
const nodemailer = require("nodemailer");
const axios = require("axios");
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "noreply@medstown.com",
    pass: "fnkmawtzfaziuigu",
  },
});
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

// Register pharmacy

router.post("/register", async (req, res) => {
  const {
    fullName,
    bussinessName,
    bussinessRegNo,
    gstNo,
    medicalLicenseNo,
    address,
    pincode,
    coordinates,
    businessPhone,
    ownerPhone,
    email,
    otp,
    dateOfMedicalLicense,
    businessTiming,
    medicineLeaf,
  } = req.body;
  try {
    let user = await pharmacydb.findOne({ businessPhone });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    user = new pharmacydb({
      fullName,
      bussinessName,
      bussinessRegNo,
      gstNo,
      medicalLicenseNo,
      address,
      pincode,
      coordinates,
      businessPhone,
      ownerPhone,
      email,
      otp,
      dateOfRegistration: new Date().toLocaleDateString(),
      dateOfMedicalLicense,
      pharmacyId: "PH" + uuid.v4(),
      pharmacyUserId: "PHU" + uuid.v4(),
      businessTiming,
      medicineLeaf,
    });
    await user.save();
    res.send({
      status: "success",
      message: "User registered successfully",
      pharmacyId: user.pharmacyId,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});

// ragister pharmacy 2


router.post("/registerPharmacy", async (req, res) => {
  const {
    fullName,
    bussinessName,
    bussinessRegNo,
    gstNo,
    medicalLicenseNo,
    address,
    pincode,
    location,
    businessPhone,
    ownerPhone,
    email,
    otp,
    dateOfMedicalLicense,
    businessTiming,
    medicineLeaf,
  } = req.body;
  try {
    let user = await pharmacydb.findOne({ businessPhone });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }
    user = new pharmacydb({
      fullName,
      bussinessName,
      bussinessRegNo,
      gstNo,
      medicalLicenseNo,
      address,
      pincode,
      location,
      businessPhone,
      ownerPhone,
      email,
      otp,
      dateOfRegistration: new Date().toLocaleDateString(),
      dateOfMedicalLicense,
      pharmacyId: "PH" + uuid.v4(),
      pharmacyUserId: "PHU" + uuid.v4(),
      businessTiming,
      medicineLeaf,
    });
    await user.save();
    res.send({
      status: "success",
      message: "User registered successfully",
      pharmacyId: user.pharmacyId,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});






router.post(
  "/regimageupload/:pharmacyId",
  upload.fields([
    { name: "businessDocumets", maxCount: 3 },
    { name: "pharmacyImage", maxCount: 2 },
    { name: "userDocumets", maxCount: 2 },
  ]),
  async (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    let imageurl = [];
    let imageurl1 = [];
    let imageurl2 = [];
    for (let i = 0; i < req.files.businessDocumets.length; i++) {
      await uploadToS3(req.files.businessDocumets[i]).then((data) => {
        imageurl.push(
          "https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/" +
          data.Key
        );
      });
    }
    for (let i = 0; i < req.files.pharmacyImage.length; i++) {
      await uploadToS3(req.files.pharmacyImage[i]).then((data) => {
        imageurl1.push(
          "https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/" +
          data.Key
        );
      });
    }
    for (let i = 0; i < req.files.userDocumets.length; i++) {
      await uploadToS3(req.files.userDocumets[i]).then((data) => {
        imageurl2.push(
          "https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/" +
          data.Key
        );
      });
    }
    await pharmacydb.updateOne(
      { pharmacyId: pharmacyId },
      {
        $set: {
          businessDocumets: imageurl,
          pharmacyImage: imageurl1,
          userDocumets: imageurl2,
        },
      }
    );
    res.send({
      status: "success",
      message: "Image uploaded successfully",
    });
  }
);

// generate otp
router.post("/generateotp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000);
  await pharmacydb.updateOne({ email: email }, { $set: { otp: otp } });
  let msg = {
    to: email,
    from: "noreply@medstown.in",
    subject: "OTP for Medstown Partner is " + otp,
    text: "OTP for Medstown Partner is " + otp,
    html: "<strong>OTP for Medstown Partner is " + otp + "</strong>",
  };
  transporter.sendMail(msg, (err, data) => {
    if (err) {
      console.log(err);
      res.send({
        status: "error",
        message: "Error in sending OTP",
      });
    } else {
      console.log("email sent");
      res.send({
        status: "success",
        message: "OTP sent successfully",
      });
    }
  });
});
router.post("/generatemobileotp", async (req, res) => {
  const { businessPhone } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000);
  await pharmacydb.updateOne(
    { businessPhone: businessPhone },
    { $set: { otp: otp } }
  );

  const data = await pharmacydb.findOne({ businessPhone: businessPhone });
  console.log(data);
  if (!data) {
    res.send({
      msg: "user not found please register",
    });
  }
  else {
    let url = `http://37.59.76.46/api/mt/SendSMS?user=Wowerr-Technologies&password=q12345&senderid=MEDSTN&channel=Trans&DCS=0&flashsms=0&number=${businessPhone}&text=Your%20login%20OTP%20for%20Medstown%20account%20is%20${otp}.%20OTP%20is%20valid%20for%2010mins.%20Do%20not%20share%20with%20anyone.%20If%20not%20requested%20by%20you,%20reach%20support@medstown.com%20-MEDSTOWN`;
    axios
      .get(url)
      .then((response) => {
        console.log(response);
        res.send({
          status: "success",
          message: "OTP sent successfully",
        });
      })
      .catch((error) => {
        console.log(error);
        res.send({
          status: "error",
          message: "Error in sending OTP",
        });
      });
  }
});
// verify otp
router.post("/verifyotp", async (req, res) => {
  const { email, otp } = req.body;
  pharmacydb
    .findOne({
      email: email,
      otp: otp,
    })
    .then((user) => {
      if (!user) {
        return res.status(400).json({ msg: "Invalid OTP" });
      }
      pharmacydb.updateOne({ email: email }, { $set: { otpVerified: true } });
      res.send({
        status: "success",
        message: "OTP verified successfully",
        data: user,
      });
    });
});
router.post("/verifymobileotp", async (req, res) => {
  const { businessPhone, otp } = req.body;
  pharmacydb
    .findOne({
      businessPhone: businessPhone,
      otp: otp,
    })
    .then((user) => {
      if (!user) {
        return res.status(400).json({ msg: "Invalid OTP" });
      }
      pharmacydb.updateOne(
        { businessPhone: businessPhone },
        { $set: { otpVerified: true } }
      );
      res.send({
        status: "success",
        message: "OTP verified successfully",
        data: user,
      });
    });
});
// register expo token
router.post("/registerexpotoken/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  const { expoToken } = req.body;
  await pharmacydb.updateOne(
    { pharmacyId: pharmacyId },
    { $set: { expoToken: expoToken } }
  );
  res.send({
    status: "success",
    message: "Expo token registered successfully",
  });
});
// update password
router.post("/updatepassword/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  const { password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const newPassword = await bcrypt.hash(password, salt);
  await pharmacydb.updateOne(
    { pharmacy: pharmacyId },
    { $set: { password: newPassword } }
  );
  res.send({
    status: "success",
    message: "Password updated successfully",
  });
});
// add medicineInventory using pharmacyId
router.post("/addmedicineinventory/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  const medicineInventory = req.body;
  // add only if medicineId is not present
  try {
    await pharmacydb.updateOne(
      {
        pharmacyId: pharmacyId,
      },
      {
        $push: {
          medicineInventory: medicineInventory,
        },
      }
    );
    res.send({
      status: "success",
      message: "Medicine added successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});
// remove duplicate medicineInventory using pharmacyId
router.get(
  "/removeduplicatemedicineinventory/:pharmacyId",
  async (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    try {
      const pharmacy = await pharmacydb.findOne({ pharmacyId: pharmacyId });
      const medicineInventory = pharmacy.medicineInventory;
      const uniqueMedicineInventory = medicineInventory.filter(
        (item, index) =>
          medicineInventory.findIndex(
            (medicine) => medicine.medicineId === item.medicineId
          ) === index
      );
      await pharmacydb.updateOne(
        {
          pharmacyId: pharmacyId,
        },
        {
          $set: {
            medicineInventory: uniqueMedicineInventory,
          },
        }
      );
      res.send({
        status: "success",
        message: "Duplicate medicine removed successfully",
      });
    } catch (err) { }
  }
);

// update medicineInventory using pharmacyId
router.post("/updatemedicineinventory/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  const medicineInventory = req.body;
  try {
    await pharmacydb.updateOne(
      {
        pharmacyId: pharmacyId,
        "medicineInventory.medicineId": medicineInventory.medicineId,
      },
      {
        $set: {
          "medicineInventory.$.medicineName": medicineInventory.medicineName,
          "medicineInventory.$.medicinePrice": medicineInventory.medicinePrice,
          "medicineInventory.$.medicineQuantity":
            medicineInventory.medicineQuantity,
          "medicineInventory.$.disease": medicineInventory.disease,
          "medicineInventory.$.rxRequired": medicineInventory.rxRequired,
        },
      }
    );
    res.send({
      status: "success",
      message: "Medicine updated successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});
// get medicineInventory using pharmacyId
router.get("/getmedicineinventory/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  try {
    const medicineInventory = await pharmacydb.findOne(
      { pharmacyId },
      {
        medicineInventory: 1,
        _id: 0,
      }
    );
    res.send(medicineInventory.medicineInventory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});
// get medicineInventory using pharmacyId  according to disease
router.get(
  "/getmedicineinventorybydisease/:pharmacyId/:disease",
  async (req, res) => {
    const pharmacyId = req.params.pharmacyId;
    const disease = req.params.disease;
    try {
      const medicineInventory = await pharmacydb.findOne(
        { pharmacyId },
        {
          medicineInventory: 1,
          _id: 0,
        }
      );
      const filteredMedicineInventory =
        medicineInventory.medicineInventory.filter(
          (medicine) => medicine.disease === disease
        );
      res.send(filteredMedicineInventory);
    } catch (err) {
      console.error(err.message);
      res.status(500).send({
        status: "error",
        message: "Server error",
      });
    }
  }
);
// edit bussinessName using pharmacyId
router.post("/editbussinessname/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  const { bussinessName } = req.body;
  try {
    await pharmacydb.updateOne(
      {
        pharmacyId: pharmacyId,
      },
      {
        $set: {
          bussinessName: bussinessName,
        },
      }
    );
    res.send({
      status: "success",
      message: "Bussiness name updated successfully",
      data: data,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});

router.post("/addbankdetails/:pharmacyId", async (req, res) => {
  const {bankName, accountNumber, ifscCode, branchName, accountHolderName} = req.body;
  const pharmacyId = req.params.pharmacyId;
  try {
    await pharmacydb.updateOne(
      {
        pharmacyId: pharmacyId,
      },
      {
        $set: {
          bankDetails: {
            bankName: bankName,
            accountNumber: accountNumber,
            ifscCode: ifscCode,
            branchName: branchName,
            accountHolderName: accountHolderName,
          },
        },
      }
    );
    res.send({
      status: "success",
      message: "Bank details added successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});

router.post("/editbankdetails/:pharmacyId", async (req, res) => {
  const {bankName, accountNumber, ifscCode, branchName, accountHolderName} = req.body;
  const pharmacyId = req.params.pharmacyId;
  try {
    await pharmacydb.updateOne(
      {
        pharmacyId: pharmacyId,
      },
      {
        $set: {
          bankDetails: {
            bankName: bankName,
            accountNumber: accountNumber,
            ifscCode: ifscCode,
            branchName: branchName,
            accountHolderName: accountHolderName,
          },
        },
      }
    );
    res.send({
      status: "success",
      message: "Bank details updated successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});

router.post("/addwalletbalance/:pharmacyId", async (req, res) => {
  const {walletBalance} = req.body;
  const pharmacyId = req.params.pharmacyId;
  try {
    await pharmacydb.updateOne(
      {
        pharmacyId: pharmacyId,
      },
      {
        $push: {
          "wallet.walletHistory": {
            transactionId: uuid.v4(),
            amount: walletBalance,
            status: "success",
            type: "credit",
            date : new Date().toLocaleDateString(),
          },
        },
        $inc: {
          "wallet.walletBalance": walletBalance,
        },
      }
    );
    res.send({
      status: "success",
      message: "Wallet balance added successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});

router.get("/getwalletbalance/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  try {
    const walletBalance = await pharmacydb.findOne(
      { pharmacyId },
      {
        "wallet.walletBalance": 1,
        _id: 0,
      }
    );
    res.send({
      status: "success",
      message: "Wallet balance fetched successfully",
      walletBalance: walletBalance.wallet.walletBalance,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});

router.get("/getwallethistory/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  try {
    const walletHistory = await pharmacydb.findOne(
      { pharmacyId },
      {
        "wallet.walletHistory": 1,
        _id: 0,
      }
    );
    res.send({
      status: "success",
      message: "Wallet history fetched successfully",
      walletHistory: walletHistory.wallet.walletHistory,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: "Server error",
    });
  }
});

router.post("/withdrawbalance/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  const {walletBalance} = req.body;
  try {
    await pharmacydb.updateOne(
      {
        pharmacyId: pharmacyId,
      },
      {
        $push: {
          "wallet.walletHistory": {
            transactionId: uuid.v4(),
            amount: walletBalance,
            status: "pending",
            type: "debit",
            date : new Date().toLocaleDateString(),
          },
        },
        $inc: {
          "wallet.walletBalance": -walletBalance,
        },
      }
    );
    res.send({
      status: "success",
      message: "Wallet balance withdrawn successfully",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: err.message,
    });
  }
});
// fetch balance and history
router.get("/getbalanceandhistory/:pharmacyId", async (req, res) => {
  const pharmacyId = req.params.pharmacyId;
  try {
    const wallet = await pharmacydb.findOne(
      { pharmacyId },
      {
        wallet: 1,
        _id: 0,
      }
    );
    res.send({
      status: "success",
      message: "Wallet fetched successfully",
      wallet: wallet.wallet,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send({
      status: "error",
      message: err.message,
    });
  }
});

module.exports = router;
