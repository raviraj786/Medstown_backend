const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const deliverydb = require("../../models/deliverydb/deliveryuser.js");
const FinalOrder = require("../../models/orders/finalorder.js");
const axios = require("axios");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");

router.post("/register", async (req, res) => {
  const { fullname, phone, drivingLicense, vehicleNumber } = req.body;
  const otpno = Math.floor(100000 + Math.random() * 900000);
  deliverydb.findOne({ phone: phone }).then((user) => {
    if (user) {
      res.json("User already exists");
    } else {
      const newUser = new deliverydb({
        fullname,
        phone,
        otp: otpno,
        drivingLicense,
        vehicleNumber,
        partnerId: uuid.v4(),
        totalBalance: 0,
      });
      newUser
        .save()
        .then((user) => {
          res.json({ user: user, messsage: "User registered successfully" });
        })
        .catch((err) => {
          console.log(err);
          res.json("mobile number already register");
        });
    }
  });
});

router.post("/generateotp", async (req, res) => {
  const { phone } = req.body;
  const otpno = Math.floor(100000 + Math.random() * 900000);
  if (phone === 9999999999) {
    res.json({ message: "OTP sent successfully" });
  } else {
    deliverydb.findOne({ phone: phone }).then((user) => {
      if (user) {
        deliverydb
          .findOneAndUpdate(
            { phone: phone },
            { $set: { otp: otpno } },
            { new: true }
          )
          .then((user) => {
            console.log(user);
            let url = `http://37.59.76.46/api/mt/SendSMS?user=Wowerr-Technologies&password=q12345&senderid=MEDSTN&channel=Trans&DCS=0&flashsms=0&number=${user.phone}&text=Your%20login%20OTP%20for%20Medstown%20account%20is%20${user.otp}.%20OTP%20is%20valid%20for%2010mins.%20Do%20not%20share%20with%20anyone.%20If%20not%20requested%20by%20you,%20reach%20support@medstown.com%20-MEDSTOWN`;
            axios.get(url).then((response) => {
              console.log(response);
              res.send({ message: "OTP sent successfully" });
            });
          })
          .catch((err) => {
            console.log(err);
          });
      } else {
        res.json("User not found");
      }
    });
  }
});
//verify otp
router.post("/verifyotp", async (req, res) => {
  const { phone, otp } = req.body;
  if (phone === 9999999999 && otp === 123456) {
    res.json({
      message: "OTP is verified",
      fullname: "test",
      phone: "9999999999",
      drivingLicense: "test",
      vehicleNumber: "test",
      partnerId: "test",
      status: true,
    });
  } else {
    deliverydb.findOne({ phone: phone }).then((user) => {
      if (user) {
        if (user.otp == otp) {
          res.json({
            message: "OTP is verified",
            fullname: user.fullname,
            phone: user.phone,
            drivingLicense: user.drivingLicense,
            vehicleNumber: user.vehicleNumber,
            partnerId: user.partnerId,
            status: true,
          });
        } else {
          res.json("OTP is incorrect");
        }
      } else {
        res.json("User not found");
      }
    });
  }
});
// set expoToken for notification
router.post("/setexpotoken", async (req, res) => {
  const { partnerId, expoToken } = req.body;
  deliverydb
    .updateOne({ partnerId: partnerId }, { $set: { expoToken: expoToken } })
    .then((user) => {
      res.json("ExpoToken updated successfully");
    })
    .catch((err) => {
      console.log(err);
      res.json("Error in updating ExpoToken");
    });
});
// get all delivery users
router.get("/getalldeliveryboy", async (req, res) => {
  deliverydb
    .find()
    .then((users) => {
      res.json(users);
    })
    .catch((err) => {
      console.log(err);
    });
});

router.post("/addbankdetails", async (req, res) => {
  // const { bankName, accountNumber, ifscCode, branchName, accountHolderName } = req.body;
  // const  partnerId = req.params.partnerId;
  try {
    const { partnerId, bankDetails } = req.body;
    // Find the user by ID
    const user = await deliverydb.findOne({ partnerId: partnerId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // Update the user's bank details
    user.BankDetails = bankDetails;
    // Save the updated user
    const updatedUser = await user.save();
    res.status(201).json(updatedUser);
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: err.message });
  }
});

//ceadit

router.post("/wallet/credit", async (req, res) => {
  const { amount, partnerId, status } = req.body;
  try {
    const deliveryBoy = await deliverydb.findOne({ partnerId: partnerId });
    if (!deliveryBoy) {
      return res.status(404).json({ message: "No user found" });
    }
    //push the amount into wallet arr
    console.log("before pushing wallet");
    deliveryBoy.wallet.push({ walletBalance: amount });
    console.log("after pushing wallet");
    //update the totalEarnings
    let totalBalance = deliveryBoy.wallet.reduce((pre, curr) => {
      return pre + parseInt(curr.walletBalance);
    }, 0);
    console.log("Total Balance - ", totalBalance);
    //update the walletHistory arr
    let obj = { transactionId: "", amount: 0, status: "" };
    obj.transactionId = uuid.v4(); //unique transcationId
    obj.amount = amount;
    obj.status = status;

    console.log("before pushing wallet history");

    deliveryBoy.walletHistory.push(obj); //storing wallet history
    console.log("before pushing wallet history");

    deliveryBoy.totalBalance += amount;
    await deliveryBoy.save();
    return res.send({
      message: `${amount} credited Successfully`,
      status: "success",
      totalBalance: deliveryBoy.totalBalance,
      transcationId: obj.transactionId,
      date: new Date(),
    });
  } catch (error) {
    console.log("Error - " + error);
    return res.status(500).send({ message: error });
  }
});

// debit apis
router.post("/wallet/debit", async (req, res) => {
  const { amount, partnerId, status } = req.body;

  try {
    const deliveryBoy = await deliverydb.findOne({ partnerId: partnerId });
    if (!deliveryBoy) {
      return res.status(404).json({ message: "No user found" });
    }
    //debit money
    //remove balance from wallet
    //now type is debit so update the walletHistory arr
    if (deliveryBoy.totalBalance >= amount) {
      let obj = { transactionId: "", amount: 0, status: "" };
      obj.transactionId = uuid.v4(); //unique transcationId
      obj.amount = amount;
      obj.status = status; //debit
      let totalBalance = deliveryBoy.wallet.reduce((pre, curr) => {
        return pre + parseInt(curr.walletBalance);
      }, 0);
      //1000 - 200 = 800
      console.log("Total Balance - ", totalBalance - amount);
      deliveryBoy.walletHistory.push(obj);
      //update totalBalance
      deliveryBoy.totalBalance -= amount;
      await deliveryBoy.save();
      return res.send({
        message: `${amount} debited Successfully`,
        status: "success",
        totalBalance: deliveryBoy.totalBalance,
        transcationId: obj.transactionId,
        date: new Date(),
      });
    } else {
      return res.send({
        message: `you have not sufficient balance`,
        status: "success",
        totalBalance: deliveryBoy.totalBalance,
        date: new Date(),
      });
    }
  } catch (error) {}
});

router.get("/balance/:partnerId", async (req, res) => {
  const { partnerId } = req.params;
  try {
    const balance = await deliverydb.findOne({ partnerId });
    res.status(200).json({ totalBalance: balance.totalBalance });
  } catch (error) {
    console.log(error);
  }
});
router.get("/getalldeliveryboy/:partnerId", async (req, res) => {
  const { partnerId } = req.params;
  try {
    const delivaryBoy = await deliverydb.findOne({ partnerId });
    res.status(200).json({ delivaryBoy });
  } catch (error) {
    console.log(error);
  }
});

// ******************* upload documant *********

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fieldSize: {
      fileSize: 10 * 1024 * 1024,
    },
  },
});

const s3 = new S3({
  endpoint: "https://usc1.contabostorage.com/medstown", // Ensure this is the correct endpoint for your provider
  s3BucketEndpoint: true, // Typically, this is false for non-AWS endpoints
  accessKeyId: "8fe5f069ca4c4b50bd74c7adf18fcf75",
  secretAccessKey: "90ea5d8271241f37b3e248ecee1843ff",
  region: "us-east-1", // Or the appropriate region if different
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
        console.error("S3 Upload Error:", err); // More detailed error logging
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

//upload documnts



router.post(
  "/uploadadharcard/:partnerId",
  upload.fields([
    { name: "adharFront", maxCount: 1 },
    { name: "adharBack", maxCount: 1 },
  ]),
  async (req, res) => {
    const { partnerId } = req.params;
    try {
      const adharFrontFile = req.files.adharFront[0];
      const adharBackFile = req.files.adharBack[0];
      const adharFrontUpload = await uploadToS3(adharFrontFile);
      const adharBackUpload = await uploadToS3(adharBackFile);
      const delivery = await deliverydb.findOne({ partnerId }).exec();
      if (!delivery) {
        return res.status(404).send({ message: "Delivery not found" });
      }
      if (!delivery.adharCard) {
        delivery.adharCard = [];
      }
      delivery.adharCard.push({
        adharFront: `https://usc1.contabostorage.com/medstown/${adharFrontUpload.Key}`,
        adharBack: `https://usc1.contabostorage.com/medstown/${adharBackUpload.Key}`,
      });
      await delivery.save();
      res.send({
        status: "success",
        message: "Adhar card uploaded successfully",
        data: delivery.adharCard,
      });
    } catch (error) {
      res.status(500).send({ message: error.message });
    }
  }
);

//////////////////////upload  user details

router.post(
  "/uploaddoc/:partnerId",
  upload.fields([
    {name : "userImage" , maxCount :1},
    {name : "penCard" , maxCount: 1},
    { name: "adharFront", maxCount: 1 },
    { name: "adharBack", maxCount: 1 },
    { name: "rcFront", maxCount: 1 },
    { name: "rcBack", maxCount: 1 },
    { name: "drivingLicenseFront", maxCount: 1 },
    { name: "drivingLicenseBack", maxCount: 1 },
  ]),
  async (req, res) => {
    const { partnerId } = req.params;
    try {
      const userImageupload =  await uploadToS3(req.files.userImage[0]);
      const penCardUpload = await uploadToS3(req.files.penCard[0]);
      const adharFrontupload = await uploadToS3(req.files.adharFront[0]);
      const adharBackUpload  = await uploadToS3(req.files.adharBack[0]);
      const rcFrontupload = await uploadToS3(req.files.rcFront[0]);
      const rcBackupload = await uploadToS3(req.files.rcBack[0]);
      const drivingLicenseFrontupload = await uploadToS3(
        req.files.drivingLicenseFront[0]
      );
      const drivingLicenseBackupload = await uploadToS3(
        req.files.drivingLicenseBack[0]
      );
      let delivery = await deliverydb.findOne({ partnerId: partnerId }).exec();
      if (!delivery) {
        return res.status(404).send({
          status: "error",
          message: "Partner not found",
        });
      }
      if (!delivery.documnetUploaded) {
        delivery.documnetUploaded = [];
      }
      delivery.documnetUploaded.push({
        userImage : `https://usc1.contabostorage.com/medstown/${userImageupload.Key}`,
        penCard : `https://usc1.contabostorage.com/medstown/${penCardUpload.Key}`,
        adharFront : `https://usc1.contabostorage.com/medstown/${adharFrontupload.Key}`,
        adharBack : `https://usc1.contabostorage.com/medstown/${adharBackUpload.Key}`,
        rcFront: `https://usc1.contabostorage.com/medstown/${rcFrontupload.Key}`,
        rcBack: `https://usc1.contabostorage.com/medstown/${rcBackupload.Key}`,
        drivingLicenseFront: `https://usc1.contabostorage.com/medstown/${drivingLicenseFrontupload.Key}`,
        drivingLicenseBack: `https://usc1.contabostorage.com/medstown/${drivingLicenseBackupload.Key}`,
      });
      await delivery.save();
      res.send({
        status: "success",
        message: "Documents uploaded successfully",
        data: delivery.documnetUploaded,
      });
    } catch (error) {
      res.status(500).send({
        status: "error",
        message: error.message,
      });
    }
  }
);

router.get("/getdoc/:partnerId", async (req, res) => {
  const { partnerId } = req.params;
  try {
    const deliveryBoy = await deliverydb.findOne({ partnerId: partnerId }).exec();
    if (!deliveryBoy) {
      return res.status(404).send({
        status: "error",
        message: "Partner not found",
      });
    }
    res.send({
      userImage: deliveryBoy.userImage,
      adharCard: deliveryBoy.adharCard,
      penCardImage: deliveryBoy.penCardImage,
      documnetUploaded: deliveryBoy.documnetUploaded,
    });
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: error.message,
    });
  }
});

module.exports = router;
