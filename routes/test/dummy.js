const express = require("express");
const router = express.Router();
const {getTimestamp,nameEmail} = require("../../middleware/test");


router.get("/getime", getTimestamp, (req, res) => {
    console.log(req.timestamp);
    res.send(req.timestamp.toString());
});

router.post("/getnameemail", nameEmail, (req, res) => {
    console.log(req.name, req.email);
    res.send(req.name + " " + req.email);
});

module.exports = router;