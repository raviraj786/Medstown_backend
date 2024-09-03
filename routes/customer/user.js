const express = require("express");
const router = express.Router();
const userdb = require("../../models/customerdb/userdb.js");
const uuid = require("uuid");
const otpgenerator = require("otp-generator");
const nodemailer = require("nodemailer");
const multer = require("multer");
const S3 = require("aws-sdk/clients/s3");
const axios = require("axios");
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "keepmailingrishabh@gmail.com",
    pass: "cwos oozw bwdu osqw",
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
router.post("/registeruser", async (req, res) => {
  const { fullName, phone, email } = req.body;
  const user = new userdb({
    fullName: fullName,
    phone: phone,
    email: email,
    userId: "USER" + uuid.v4(),
    otp: otpgenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      alphabets: false,
    }),
    date : date,
  });
  let msg = {
    from: "keepmailingrishabh@gmail.com",
    to: email,
    subject: "OTP for login is " + user.otp,
    text: "OTP for login is " + user.otp,
  };
  transporter.sendMail(msg, (err, data) => {
    if (err) {
      console.log("Error Occurs", err);
    } else {
      user.save();
      res.send({
        status: "success",
        message: "OTP sent to your email",
      });
    }
  });
});



router.post("/registermobileuser", async (req, res) => {
  const { fullName, phone, email } = req.body;
  const otp = Math.floor(1000 + Math.random() * 9000);

  try {
    const existingUser = await userdb.findOne({ phone: phone });

    if (existingUser) {
      return res.send("User already exists");
    } else {
      const user = new userdb({
        fullName: fullName,
        phone: phone,
        email: email,
        userId: "USER" + uuid.v4(),
        otp: otp,
      });

      let url = `http://37.59.76.46/api/mt/SendSMS?user=Wowerr-Technologies&password=q12345&senderid=MEDSTN&channel=Trans&DCS=0&flashsms=0&number=${phone}&text=Your%20login%20OTP%20for%20Medstown%20account%20is%20${otp}.%20OTP%20is%20valid%20for%2010mins.%20Do%20not%20share%20with%20anyone.%20If%20not%20requested%20by%20you,%20reach%20support@medstown.com%20-MEDSTOWN`;

      const smsResponse = await axios.get(url);

      if (smsResponse.status === 200) {
        await user.save();
        res.send({
          status: "success",
          message: "OTP sent to your mobile",
          userId: user.userId,
        });
      } else {
        res.send({
          status: "error",
          message: "OTP not sent",
        });
      }
    }
  } catch (error) {
    res.status(500).send({
      status: "error",
      message: "An error occurred during registration",
    });
  }
});




router.post("/loginmobileuser", async (req, res) => {
  const { phone } = req.body;
  userdb.findOne({ phone: phone }, (err, user) => {
    if (!user) {
      res.send({
        status: "error",
        message: "User not found",
      });
    } else {
      const otp = Math.floor(1000 + Math.random() * 9000);
      let url = `http://37.59.76.46/api/mt/SendSMS?user=Wowerr-Technologies&password=q12345&senderid=MEDSTN&channel=Trans&DCS=0&flashsms=0&number=${phone}&text=Your%20login%20OTP%20for%20Medstown%20account%20is%20${otp}.%20OTP%20is%20valid%20for%2010mins.%20Do%20not%20share%20with%20anyone.%20If%20not%20requested%20by%20you,%20reach%20support@medstown.com%20-MEDSTOWN`;
      axios
        .get(url)
        .then((response) => {
          if (response.data) {
            user.otp = otp;
            user.save();
            res.send({
              status: "success",
              message: "OTP sent to your mobile",
            });
          } else {
            res.send({
              status: "error",
              message: "OTP not sent",
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
});
router.post("/loginuser", async (req, res) => {
  const { email } = req.body;
  userdb.findOne({ email: email }, (err, user) => {
    if (!user) {
      res.send({
        status: "error",
        message: "User not found",
      });
    } else {
      const otpnumber = otpgenerator.generate(6, {
        upperCase: false,
        specialChars: false,
        alphabets: false,
      });
      let msg = {
        from: "keepmailingrishabh@gmail.com",
        to: email,
        subject: "OTP for login is " + otpnumber,
        text: "OTP for login is " + otpnumber,
      };
      transporter.sendMail(msg, (err, data) => {
        if (err) {
          console.log("Error Occurs", err);
        } else {
          user.otp = otpnumber;
          user.save();
          res.send({
            status: "success",
            message: "OTP sent to your email",
          });
        }
      });
    }
  });
});
// enter otp and login user
router.post("/enterotp", async (req, res) => {
  const { email, otp } = req.body;
  userdb.findOne(
    {
      email: email,
      otp: otp,
    },
    (err, user) => {
      if (otp == user.otp) {
        res.send({
          status: "success",
          message: "User logged in successfully",
          userId: user.userId,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          patientDetails: user.patientDetails,
          userType: user.userType,
          profilePic: user.profilePic,
        });
      } else {
        res.send({
          status: "error",
          message: "OTP is incorrect",
        });
      }
    }
  );
});
router.post("/entermobileotp", async (req, res) => {
  const { phone, otp } = req.body;
  console.log(phone, otp)
  userdb.findOne(
    {
      phone: phone,
      otp: otp,
    },
    (err, user) => {
      if (otp == user.otp) {
        res.send({
          status: "success",
          message: "User logged in successfully",
          userId: user.userId,
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          patientDetails: user.patientDetails,
          userType: user.userType,
          profilePic: user.profilePic,
        });
      } else {
        res.send({
          status: "error",
          message: "OTP is incorrect",
        });
      }
    }
  );
});
// upload prescription
router.post(
  "/uploadprescription/:customerId",
  upload.single("prescription"),
  async (req, res) => {
    const { customerId } = req.params;
    console.log(customerId, req.file);
    await uploadToS3(req.file).then(async (data) => {
      await userdb.findOne({ userId: customerId }, (err, user) => {
        if (!user) {
          res.send({
            status: "error",
            message: "User not found",
          });
        } else {
          // push in array of prescription
          user.prescription.push({
            prescriptionId: "PRE" + uuid.v4(),
            prescriptionUrl:
              "https://usc1.contabostorage.com/f49065475849480fbcd19fb8279b2f98:medstown/" +
              data.key,
            uploadDate: new Date(),
          });
          user.save();
          res.send({
            status: "success",
            message: "Prescription uploaded successfully",
            data: user.prescription,
          });
        }
      });
    });
  }
);
// router get all users
router.get("/getallusers", async (req, res) => {
  await userdb.find({}, (err, users) => {
    if (users) {
      res.send({
        status: "success",
        message: "All users",
        data: users,
      });
    } else {
      res.send({
        status: "error",
        message: "No users found",
      });
    }
  });
});



router.get("/getuser/:id" , async(req,res) => {
  const {id} = req.params;
  const user = await userdb.findOne({userId : id})
  res.json(user)

})



router.get("/deleteuser/:id" ,async (req,res) =>{
  const {id} = req.params;
   await userdb.deleteOne({userId:id})
  res.json("user is deleted")
})





module.exports = router;
