const express = require("express");
const bodyParser = require("body-parser");
const app = express();
var cors = require("cors");
require('dotenv').config();

app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
require("./dbconnection/db");
// cors enabled ***************************************************************
app.use(cors({ credentials: true, origin: "*" }));
// *****************************************************************************

let pharmacyRegister = require("./routes/pharmacy/regpharma");
let addMedicine = require("./routes/pharmacy/addmedicine");
let pharmacyInventory = require("./routes/pharmacy/pharmacyinventory");
let imageUpload = require("./routes/pharmacy/imageupload");
let qaMedicine = require("./routes/pharmacy/qamedicine");
let category = require("./routes/pharmacy/category");
let datascarp = require("./routes/scrapping/nprec.js");
let payment = require("./routes/payment/payment.js");
let razorpay = require("./routes/payment/razorpay.js")
let sendOrder = require("./routes/customer/sendOrder");
let updetedApis = require("./routes/customer/updetedApis.js")
  
// ******************************* customer api ************************************************
let customerRegister = require("./routes/customer/user");
let findPharmacy = require("./routes/customer/getPharmacy");
let homepageapi = require("./routes/customer/homePageApi");

// ******************************* pharmacy api ************************************************

// ******************************* admin api ************************************************
let getmeds = require("./routes/admin/getallmeds");
let getpharmacy = require("./routes/admin/getallpharmacy");
let  loginadmin = require("./routes/admin/loginadmin");

// ******************************* delivery api ************************************************
let deliveryRegister = require("./routes/delivery/register");
let fetchpharmacy = require("./routes/delivery/fetchPhar");


// ******************************* routes api ************************************************
app.use("/pharmacy", pharmacyRegister);
app.use("/pharmacy", addMedicine);
app.use("/pharmacy", pharmacyInventory);
app.use("/pharmacy", imageUpload);
app.use("/pharmacy", qaMedicine);
app.use("/pharmacy", category);

// ************************************************************************************
app.use("/customer", customerRegister);
app.use("/customer", findPharmacy);
app.use("/customer", homepageapi);
app.use("/customer", sendOrder);
app.use("/customer", updetedApis);

// **********************************admin**************************************************
app.use("/admin", getmeds);
app.use("/admin", getpharmacy);
app.use("/admin", loginadmin);

// **********************************delivery**************************************************
app.use("/delivery", deliveryRegister);
app.use("/delivery", fetchpharmacy);

// **********************************payment**************************************************
app.use("/pay", payment);
app.use("/pay/p1" , razorpay);

// **********************************srapping**************************************************
app.use("/rbt", datascarp);

// scripts to run medstownss
const createSearchMed = require("./scripts/createseachmed");

// **********************************searchmed**************************************************
app.use("/searchmed", createSearchMed);

// *************************************test***********************************************

let test = require("./routes/test/dummy");
app.use("/test", test);

app.get("/", (req, res) => {
  res.send(
    `<H1 style=color:#2bda2b;text-align:center;font-family:sans-serif;margin-top:100px>Medico Backend is Running </H1>`
  );
});
// **********************************************************************************
app.listen(7001 , () => {
  console.log(`listening on port ${7001}!`);
});
