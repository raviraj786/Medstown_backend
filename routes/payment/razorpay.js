// code is start
const express = require("express");
const router = express.Router();
const orderPayment = require("../../models/payment/orderPayment.js");
const Razorpay = require("razorpay");
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/makeNewPayment", async (req, res) => {
  console.log("api");
  const { orderTotal, customerId, notes } = req.body;
  try {
    if (!orderTotal || !customerId) {
      //save details in fail payment model  (customerId,orderTotals,)
      return res.status(400).json({
        message: "Please Provide All Required Fields",
        status: "Fail",
        created: false,
      });
    }
    instance.orders
      .create({
        amount: orderTotal, //1 rupeee
        currency: "INR",
        receipt: customerId,
        partial_payment: false,
        notes: notes,
      })
      .then((data) => {
        console.log("Response - ", data);
        //orderId ->frontend
        return res.status(200).json({
          data: data,
          status: "Success",
          message: "Payment Initiated Successfully",
        });
      })
      .catch((err) => {
        console.log(err.message, "Error Occurred while creating order");
        console.log(err);
        return res
          .status(400)
          .json({ message: "Error Occurred", status: "Fail" });
      });
  } catch (error) {
    console.log("Error Occurred", error);
    return res.status(400).json({ message: "Error Occurred", status: "Fail" });
  }
});

router.put("/verifyrazorpaypayment", async (req, res) => {
  try {
    const {
      orderId,
      orderDetails,
      orderTotal,
      orderStatus,
      orderNature,
      customerId,
      mobileNumber,
      paymentId,
      successData,
    } = req.body;
    console.log("Triggered getData route");
    //   console.log("user id - ",userId);
    //  console.log("Payment Id - ",paymentId);
    //  console.log("razorPay Id - ",razorPayOrderId);
    //  console.log("payment Id",successData.razorpay_payment_id);
    const payload =
      successData.razorpay_order_id + "|" + successData.razorpay_payment_id;
    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    hmac.update(payload);
    const generated_signature = hmac.digest("hex");
    //  console.log('Generated Signature:',generated_signature);
    if (generated_signature === successData.razorpay_signature) {
      const payment = new orderPayment({
        orderId: orderId,
        orderDetails: orderDetails,
        orderTotal: orderTotal,
        orderStatus: orderStatus,
        orderNature: orderNature,
        customerId: customerId,
        mobileNumber: mobileNumber,
        paymentStatus: "sucessful",
        paymentId: paymentId,
      });
      const savePayment = await payment.save();
      console.log("save payment - ", savePayment);
      return res
        .status(200)
        .json({ status: "Payment Successful", data: payment });
    } else {
      const payment = new orderPayment({
        orderId: orderId,
        orderDetails: orderDetails,
        orderTotal: orderTotal,
        orderStatus: orderStatus,
        orderNature: orderNature,
        customerId: customerId,
        mobileNumber: mobileNumber,
        paymentStatus: "fail",
        paymentId: paymentId,
      });
      const savePayment = await payment.save();
      console.log("save payment - ", savePayment);
      return res
        .status(201)
        .json({ status: "Payment Unsuccessful", data: payment });
    }
  } catch (error) {
    return res.send("Error Occurred!" + error.message);
  }
});

module.exports = router;
