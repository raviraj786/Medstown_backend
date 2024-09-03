const express = require("express");
const router = express.Router();
const Userdb = require("../../models/customerdb/userdb");
const Pharmacy = require("../../models/pharmacydb/registerpharmacydb");
const DeliveryUser = require("../../models/deliverydb/deliveryuser");
const pharmacydb = require("../../models/pharmacydb/registerpharmacydb");

router.post("/loginadmin", async (req, res) => {
  const { email, password } = req.body;
  if (email === "admin@medstown.com" && password === "admin@123") {
    res.send({
      status: "success",
      message: "Admin logged in successfully",
    });
  } else {
    res.send({
      status: "error",
      message: "Invalid credentials",
    });
  }
});


//user count

router.get("/showcount", async (req, res) => {
    try {
      const userCount = await Userdb.countDocuments();
      const pharmacyCount = await pharmacydb.countDocuments();
      const deliveryUserCount = await DeliveryUser.countDocuments();
  
      res.send({
        user: userCount,
        pharmacies: pharmacyCount,
        delivaryuser: deliveryUserCount,
      });
    } catch (error) {
      res.status(500).send("An error occurred while fetching the data.");
    }
  });

module.exports = router;
