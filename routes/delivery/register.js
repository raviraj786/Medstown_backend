const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const deliverydb = require("../../models/deliverydb/deliveryuser.js");
const axios = require("axios");

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
      });
      newUser
        .save()
        .then((user) => {
          res.json("User registered successfully");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
});
 
router.post("/generateotp", async (req, res) => {
  const { phone } = req.body;
  const otpno = Math.floor(100000 + Math.random() * 900000);
if(phone === 9999999999){
  res.json({message:"OTP sent successfully"});
}
else{
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
  if(phone === 9999999999 && otp === 123456){
    res.json({
      message: "OTP is verified",
      fullname: "test",
      phone: "9999999999",
      drivingLicense: "test",
      vehicleNumber: "test",
      partnerId: "test",
      status: true,
    });
  }
  else{
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


module.exports = router;
