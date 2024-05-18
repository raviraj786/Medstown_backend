const express = require("express");
const router = express.Router();
const uuid = require("uuid");
const deliverydb = require("../../models/deliverydb/deliveryuser.js");
const FinalOrder = require("../../models/orders/finalorder.js");
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
      date : new Date()
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
      });
    } else {
      return res.send({
        message: `you have not sufficient balance`,
        status: "success",
        totalBalance: deliveryBoy.totalBalance,
        date : new Date()
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

module.exports = router;
