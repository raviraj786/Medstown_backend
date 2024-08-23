const express = require("express");
const router = express.Router();
require("dotenv").config();
const referPharmacy = require("../../models/orders/referpharmacy.js");



//   ReferPharmcy apis
router.post("/referPharmacy", async(req, res) => {
    const {
        customerId,
        pharmacyName,
        pharmacyownername,
        PharmacyMobileNumber,
        PharmacyLocation,
      } = req.body;
    try {
          const referpharmacy = await referPharmacy.create({
            customerId : customerId ,
            pharmacyName : pharmacyName,
            pharmacyownername : pharmacyownername,
            PharmacyMobileNumber : PharmacyMobileNumber,
            PharmacyLocation : PharmacyLocation
          })
          await referpharmacy.save()
          res.status(200).send(referpharmacy) 
    } catch (error) {
        res.status(500).send({ error: error.message });
    }
});
















module.exports = router;
