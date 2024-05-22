// code is start
const express = require("express");
const router = express.Router();
const orderPayment = require("../../models/payment/orderPayment.js");
const Razorpay = require("razorpay");

const QRCode = require("qrcode");
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

// Rezorpay qrCode APIS

//generate qr code
router.post("/generateQRCode", async (req, res) => {
  try {
    // Extract necessary details from the request body
    const {
      amount,
      currentCustomerId,
      description,
      notes,
      id,
      orderId,
      orderDetails,
    } = req.body;
    // Function to get or create a customer
    async function getOrCreateCustomer(customerDetails) {
      try {
        const customerList = await instance.customers.all();
        let customer = customerList.items.find(
          (c) => c.id === customerDetails.id
        );

        if (!customer) {
          customer = await instance.customers.create(customerDetails);
        }
        return customer.id;
      } catch (error) {
        console.error("Error fetching/creating customer:", error);
        throw error;
      }
    }

    // Function to create a QR code
    async function createQrCode() {
      try {
        const customerDetails = {
          id: currentCustomerId,
        };

        const customerId = await getOrCreateCustomer(customerDetails);
        console.log("Customer ID: ", customerId);

        // const amount = 5000; // Example amount
        // const description = "Payment for order #1234"; // Example description

        // Get the current time in seconds
        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        // Set the close_by time to be at least 2 minutes (120 seconds) after the current time
        const closeByTime = currentTimeInSeconds + 130;
        console.log("Close by time: ", closeByTime);
        const qrCodeData = await instance.qrCode.create({
          type: "upi_qr",
          name: "Store Front Display",
          usage: "single_use",
          fixed_amount: true,
          payment_amount: amount,
          description: description,
          customer_id: customerId,
          close_by: closeByTime,
          notes: {
            purpose: notes || "Test UPI QR Code notes",
          },
        });
        console.log("Success QR Code Payment data: ", qrCodeData);
        const newQRpayment = new orderPayment({
          orderTotal: amount,
          orderNature: "rezorpay",
          paymentId: qrCodeData.id,
          customerId: id,
          orderId: orderId,
          orderDetails: orderDetails,
        });
        const savePayment = await newQRpayment.save();
        // console.log("save payment - ", savePayment);
        return res.status(200).send(qrCodeData);
      } catch (err) {
        console.error("Failure QR code payment", err);
        return res.status(500).send({
          error: "Failed to create QR code",
          details: err,
        });
      }
    }
    // Call the function to create the QR code
    await createQrCode();
  } catch (error) {
    console.error("Error occurred: ", error);
    return res.status(500).send({
      error: "Internal Server Error",
      details: error,
    });
  }
});

router.get("/qrCodeConfimpay/:paymentId", async (req, res) => {
  try {
    const data = await orderPayment.findOne({
      paymentId: req.params.paymentId,
    });
    if (!data) {
      return res.status(404).json({ error: "Payment not found" });
    }
    const respone = await instance.qrCode.fetch(data.paymentId);
    console.log("respone:", respone);
    const updatedPayment = await orderPayment.findOneAndUpdate(
      { paymentId: req.params.paymentId },
      {
        $set: {
          paymentStatus: respone.status,
          orderStatus:
            respone.payments_amount_received === 0 ||
            respone.payments_amount_received == null ||
            respone.payments_amount_received == undefined
              ? "payment_fail"
              : "payment_confimed",
          orderTotal: data.orderTotal,
          orderNature: "rezorpay",
          paymentId: respone.id,
          customerId: data.customerId,
          createdAt: new Date(),
        },
      },
      { new: true } // `new` returns the updated document
    );
    // console.log("Updated Payment:", updatedPayment);
    res.status(201).json({ respone, updatedPayment });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" , error });
  }
});






module.exports = router;
