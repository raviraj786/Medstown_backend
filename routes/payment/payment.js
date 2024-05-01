const express = require("express");
const router = express.Router();
const axios = require("axios");
const orderPayment = require("../../models/payment/orderPayment.js");
const crypto = require("crypto");
const sdk = require("api")("@phonepe-docs/v1#3dxznuf1gljiezluv");

router.post("/initiatepayment", async (req, res) => {
  const {
    orderId,
    orderDetails,
    orderTotal,
    orderStatus,
    orderNature,
    customerId,
    mobileNumber,
  } = req.body;
  console.log(
    "req.body",
    orderId,
    orderDetails,
    orderTotal,
    orderStatus,
    orderNature,
    customerId,
    mobileNumber
  );
  const merchantId = "PGTESTPAYUAT";
  const saltIndex = 1;
  const saltKey = "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
  const api_endpoint = "/pg/v1/pay";
  if (
    !orderId ||
    !orderDetails ||
    !orderTotal ||
    !orderStatus ||
    !orderNature ||
    !customerId ||
    !mobileNumber
  ) {
    res.status(400).json({
      status: "failed",
      message: "Please provide all the required fields",
    });
  }
  const phonePeObj = {
    merchantId: merchantId,
    merchantTransactionId: orderId,
    merchantUserId: customerId,
    amount: orderTotal,
    redirectUrl: `https://api.medstown.com/pay/payredirect?mid=${merchantId}&mtxid=${orderId}`,
    redirectMode: "REDIRECT",
    callbackUrl: `https://api.medstown.com/pay/paycallback`,
    mobileNumber: mobileNumber,
    paymentInstrument: {
      type: "PAY_PAGE",
    },
  };
  console.log("phonePeObj", phonePeObj);
  const objBase64 = Buffer.from(JSON.stringify(phonePeObj)).toString("base64");
  const X_VERIFY =
    Buffer.from(JSON.stringify(phonePeObj)).toString("base64") +
    api_endpoint +
    saltKey;
  const hash = crypto.createHash("sha256");
  hash.update(X_VERIFY);
  const X_VERIFY_SHA256 = hash.digest("hex") + "###" + saltIndex;
  const headers = {
    "Content-Type": "application/json",
    "X-VERIFY": X_VERIFY_SHA256,
  };
  if (X_VERIFY_SHA256 && objBase64) {
    axios
      .post(
        "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay",
        { request: objBase64 },
        { headers: headers }
      )
      .then(async (response) => {
        console.log("response", response.data);
        const payment = new orderPayment({
          orderId: orderId,
          orderDetails: orderDetails,
          orderTotal: orderTotal,
          orderStatus: orderStatus,
          orderNature: orderNature,
          customerId: customerId,
          mobileNumber: mobileNumber,
        });
        const savedPayment = await payment.save();
        console.log("savedPayment", savedPayment);
        res.status(200).json({
          status: "success",
          message: "Payment initiated successfully",
          data: response.data,
          
        });
      })
      .catch((error) => {
        console.log("error", error);
        res.status(400).json({
          error: error,
          status: "failed from catch",
        });
      });
  }
});

router.get("/payredirect", async (req, res) => {
  const { mid, mtxid } = req.query;
  console.log("req.query", req.query);
  if (mid && mtxid) {
    res.status(200).send(`
      <html>
        <body style="text-align:center; margin-top: 100px; font-family: sans-serif; color: #2bda2b;">
          <h4>Please Close this window we will verify your payment</h4>
        </body>
      </html>
    `);
  } else {
    res.status(400).json({
      status: "failed",
      message: "Please provide all the required fields",
    });
  }
});

router.get("/verifypayment", async (req, res) => {
  const { mid, mtxid } = req.query;
  try {
    if (!mid || !mtxid) {
      res.status(400).json({
        status: "failed",
        message: "Please provide all the required fields",
      });
    }
    const X_VERIFY_SHA256 =
      crypto
      
        .createHash("sha256")
        .update(
          `/pg/v1/status/${mid}/${mtxid}099eb0cd-02cf-4e2a-8aca-3e6c6aff0399`
        )
        .digest("hex") +
      "###" +
      1;
    const headers = {
      "Content-Type": "application/json",
      "X-VERIFY": X_VERIFY_SHA256,
      "X-MERCHANT-ID": mid,
    };
    console.log(headers, "headers");
    try {
      const url = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${mid}/${mtxid}`;
      axios
        .get(url, { headers: headers })
        .then(async (response) => {
          const data = response.data.data;
          console.log("response", data);
          const updatedPayment = await orderPayment.updateOne(
            { orderId: data.merchantTransactionId },
            { orderStatus: response.data.code },
            { paymentId: data.transactionId }
          );
          res.status(200).json({
            status: "success",
            message: "Payment verified successfully",
            data: response.data,
          });
        })
        .catch((error) => {
          console.log("error", error);
          res.status(400).json({
            error: error,
            status: "failed from catch",
          });
        });
    } catch (error) {
      console.log(error, "error");
    }
  } catch (error) {
    console.log(error, "error");
  }
});

module.exports = router;
