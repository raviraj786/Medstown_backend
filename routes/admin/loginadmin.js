const express = require("express");
const router = express.Router();

router.post("/loginadmin", async (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@medstown.com" && password === "admin@123") {
        res.send({
            status: "success",
            message: "Admin logged in successfully",
        });
    }
    else {
        res.send({
            status: "error",
            message: "Invalid credentials",
        });
    }
});

module.exports = router;