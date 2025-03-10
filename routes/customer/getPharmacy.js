const express = require("express");
const router = express.Router();
const pharmacydb = require("../../models/pharmacydb/registerpharmacydb.js");
require("dotenv").config();
const axios = require("axios");
const { Expo } = require("expo-server-sdk");
const uuid = require("uuid");
const airorder = require("../../models/orders/airorder.js");
const deliveryboydb = require("../../models/deliverydb/deliveryuser.js");
const finalorder = require("../../models/orders/finalorder.js");
const { date } = require("yup");

// show pharmacies
router.post("/getPharmacy", async (req, res) => {
  try {
    const { lng, lat } = req.body;
    // Validate input parameters
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid coordinates" });
    }
    // Define search options
    const options = {
      location: {
        $geoWithin: {
          $centerSphere: [[lat, lng], 30 / 3963.2],
        },
      },
    };
    const pharmacies = await pharmacydb.find(options);
    res.status(200).json(pharmacies);
  } catch (error) {
    console.log(error, "NO PHARMACIES FOUND");
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});

// show Delivery boys
router.post("/getDelivary", async (req, res) => {
  try {
    const { lat, lng } = req.body;
    // Validate input parameters
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid coordinates" });
    }
    // Define search options
    const options = {
      location: {
        $geoWithin: {
          $centerSphere: [[lat, lng], 30 / 3963.2],
        },
      },
    };
    const deliverypartner = await deliveryboydb.find(options);
    res.status(200).json(deliverypartner);
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, error: "internat server error" });
  }
});

// ORDER MEDICINS
router.post("/orderMedicines", async (req, res) => {
  try {
    const {
      customerId,
      orderDetails,
      quantity,
      lat,
      lng,
      orderId,
      totalPrice,
      precriptionUrl,
    } = req.body;
    const options = {
      location: {
        $geoWithin: {
          $centerSphere: [[lat, lng], 30 / 3963.2],
        },
      },
    };
    const pharmacies = await pharmacydb.find(options);
    console.log("pharmacy", pharmacies.length);
    if (pharmacies.length === 0) {
      return res.json({ message: "NO PHARMACIES FOUND" });
    }
    const orderData = [];
    for (let i = 0; i < pharmacies.length; i++) {
      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${lat},${lng}&destinations=${pharmacies[i].location.coordinates[0]},${pharmacies[i].location.coordinates[1]}&key=${process.env.GOOGLE_MAPS_API_KEY}&mode=driving`;
      try {
        const response = await axios.get(url);
        if (
          response.data &&
          response.data.rows[0].elements[0].status === "OK"
        ) {
          const distance =
            response.data.rows[0].elements[0].distance.value / 1000;
          orderData.push({
            pharmacyId: pharmacies[i].pharmacyId,
            distance,
            expoToken: pharmacies[i].expoToken,
            orderDetails,
            quantity,
            customerId,
            status: "pending",
            orderId,
            totalPrice,
            userLat: lat,
            userLng: lng,
            precriptionUrl,
          });
        } else {
          console.error(
            "Invalid response from Google Distance Matrix API:",
            response.data
          );
        }
      } catch (error) {
        console.error("Error fetching distance:", error);
        // Handle Axios request error
      }
    }
    const orderPromises = orderData.map((data, i) => {
      return new Promise(async (resolve, reject) => {
        try {
          const existingOrder = await airorder.findOne({
            orderId: data.orderId,
          });
          if (
            existingOrder &&
            existingOrder.orderId === data.orderId &&
            existingOrder.orderNature
          ) {
            return res.json({ message: "ORDER ALREADY ACCEPTED" });
          }
          if (!data.expoToken || data.expoToken.trim() === "") {
            console.log(
              "Expo token is null or empty, skipping notification for this pharmacy"
            );
            resolve();
            return;
          }
          const expo = new Expo();
          const messages = [
            {
              to: data.expoToken,
              sound: "default",
              title: "New Order",
              body: "You have a new order from customer",
              data,
            },
          ];
          const chunks = expo.chunkPushNotifications(messages);
          const tickets = [];
          for (let chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
          }
          // console.log("ooooooooooooooooo", data)
          await airorder.create(data);
          for (let ticket of tickets) {
            if (ticket.status === "error") {
              console.log("NOTIFICATION NOT SENT");
              if (ticket.details) {
                console.error(`The error code is ${ticket.details.error}`);
              }
            }
          }
          resolve();
        } catch (error) {
          console.error("Error processing order:", error);
          reject(error);
        }
      });
    });
    await Promise.all(orderPromises);
    res.json({ message: "Order has been sent to the pharmacy" });
  } catch (error) {
    console.error("An error occurred:", error.message);
    res.status(500).json({ message: "internat server error" });
  }
});

// accept order using pharmacy id and order id
router.post("/acceptOrder", async (req, res) => {
  const { pharmacyId, orderId, status } = req.body;
  console.log(pharmacyId, orderId);
  const order = await airorder.findOne({
    pharmacyId: pharmacyId,
    orderId: orderId,
  });
  if (order) {
    order.status = status;
    await order.save();
    res.json(order);
  } else {
    res.json({ message: "NO ORDER FOUND" });
  }
});

router.post("/checkOrderAccepted", async (req, res) => {
  const { orderId } = req.body;
  try {
    const orders = await airorder.find({ orderId: orderId });
    // Filter orders based on status
    const acceptedOrders = orders.filter((item) => item.status === "accepted");
    const pendingOrders = orders.filter((item) => item.status === "pending");
    const rejectedOrders = orders.filter((item) => item.status === "rejected");
    if (acceptedOrders.length > 0) {
      res.json({
        message: "Order is accepted.",
        status: "accepted",
        orders: acceptedOrders,
      });
    } else if (pendingOrders.length > 0) {
      res.json({
        message: "Order is pending. We will notify you when it is accepted.",
        status: "pending",
        // orders: pendingOrders
      });
    } else if (rejectedOrders.length > 0) {
      res.json({
        message: "Order is rejected.",
        status: "rejected",
        // orders: rejectedOrders
      });
    } else {
      res.json({ message: "NO ORDER FOUND" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

//send order to nearesrt delivery boy
router.post("/sendOrderToDeliveryBoy", async (req, res) => {
  const {
    orderDetails,
    userLat,
    userLng,
    pharmacyLat,
    pharmacyLng,
    pharmacyId,
    customerId,
    totalPrice,
    orderId,
  } = req.body;
  const options = {
    location: {
      $geoWithin: {
        $centerSphere: [[pharmacyLng, pharmacyLat], 30 / 3963.2], // 30 miles = 48.2803 km
      },
    },
  };
  const deliveryBoy = await deliveryboydb.find(options);
  const arr = [];
  const orderData = [];
  if (deliveryBoy.length === 0) {
    return res.json({ message: "NO delivery boy FOUND" });
  }
  console.log("deliveryBoy :", deliveryBoy.length);

  for (let i = 0; i < deliveryBoy.length; i++) {
    const url =
      "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=" +
      pharmacyLng +
      "," +
      pharmacyLat +
      "&destinations=" +
      deliveryBoy[i].location.coordinates[0] +
      "," +
      deliveryBoy[i].location.coordinates[1] +
      "&key=" +
      process.env.GOOGLE_MAPS_API_KEY +
      "&mode=driving";
    await axios
      .get(url)
      .then((response) => {
        arr.push(response.data.rows[0].elements[0].distance.value);
        arr[i] = arr[i] / 1000;
        console.log(arr[i]);
      })
      .catch((err) => {
        console.log(err);
      });
    orderData.push([
      {
        deliveryBoyId: deliveryBoy[i].partnerId,
        distance: arr[i],
        expoToken: deliveryBoy[i].expoToken,
      },
      {
        orderDetails: orderDetails,
        userLat: userLat,
        userLng: userLng,
        pharmacyLat: pharmacyLat,
        pharmacyLng: pharmacyLng,
        pharmacyId: pharmacyId,
        customerId: customerId,
        totalPrice: totalPrice,
        orderId: orderId,
        distance: arr[i],
        deliveryBoyLat: deliveryBoy[i].location.coordinates[0],
        deliveryBoyLng: deliveryBoy[i].location.coordinates[1],
      },
    ]);
  }

  const orderPromises = orderData.map((order, i) => {
    return new Promise((resolve) => {
      setTimeout(async function timer() {
        const order = await airorder.findOne({
          orderId: orderData[i][1].orderId,
        });
        if (
          order &&
          order.orderId != null &&
          orderData[i][1].orderId === order.orderId
        ) {
          if (order.orderNature === true) {
            console.log("ORDER ALREADY ACCEPTED BY ANOTHER DELIVERY BOY");
            return resolve();
          }
          if (
            !orderData[i][0].expoToken ||
            orderData[i][0].expoToken.trim() == ""
          ) {
            console.log(
              "Expo token is null or empty, skipping notification for this delivaryboy"
            );
            return resolve();
          }
        }

        const expo = new Expo();
        const chunks = expo.chunkPushNotifications([
          {
            to: orderData[i][0].expoToken,
            sound: "default",
            title: "New Order",
            body: "You have a new order from pharmacy",
            data: { orderData: orderData[i][1] },
          },
        ]);
        const tickets = [];
        for (let chunk of chunks) {
          try {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
            await airorder.create({
              orderId: orderData[i][1].orderId,
              orderDetails: orderData[i][1].orderDetails,
              userLat: orderData[i][1].userLat,
              userLng: orderData[i][1].userLng,
              pharmacyLat: orderData[i][1].pharmacyLat,
              pharmacyLng: orderData[i][1].pharmacyLng,
              pharmacyId: orderData[i][1].pharmacyId,
              customerId: orderData[i][1].customerId,
              totalPrice: orderData[i][1].totalPrice,
              deliveryBoyId: orderData[i][0].deliveryBoyId,
              deliveryBoyLat: orderData[i][1].deliveryBoyLat,
              deliveryBoyLng: orderData[i][1].deliveryBoyLng,
              status: "pending",
            });
            for (let ticket of tickets) {
              if (ticket.status === "error") {
                console.log("NOTIFICATION NOT SENT");
                if (ticket.details) {
                  console.error(`The error code is ${ticket.details.error}`);
                }
              }
            }
          } catch (error) {
            console.error(error);
          }
        }
        resolve();
      }, i * 10000);
    });
  });

  Promise.all(orderPromises)
    .then(() => {
      res.json({ message: "Order has been sent to the delivary partner" });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({
        message:
          "An error occurred while processing the orders internet is not working ",
      });
    });
});

router.post("/changedelivarystatatus", async (req, res) => {
  const { deliveryBoyId, orderId } = req.body;
  const order = await airorder.findOne({
    deliveryBoyId: deliveryBoyId,
    orderId: orderId,
  });
  if (order) {
    order.status = "accepted";
    await order.save();
    res.json(order);
  } else {
    res.json("no network");
  }
});

router.post("/finalorder/status", async (req, res) => {
  const { orderId } = req.body;
  try {
    const order = await finalorder.findOne({ orderId: orderId });
    const notfypharmacyList = await airorder.find({ orderId: orderId });
    notfypharmacyList.forEach(async (notfypharmacy) => {
      notfypharmacy.status = "Order Cancelled";
      await notfypharmacy.save();
    });
    order.status = "Order Cancelled";
    await order.save();
    res.json({ message: "Order successfully cancelled" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "An error occurred", error: error.message });
  }
});

router.post("/changePharmacyMedsStatus", async (req, res) => {
  const { pharmacyId, orderId, medicineId } = req.body;
  const order = await airorder.findOne({
    pharmacyId: pharmacyId,
    orderId: orderId,
  });
  console.log(order);
  // await order.save();
  for (let i = 0; i < order.orderDetails.length; i++) {
    if (order.orderDetails[i].medicineId === medicineId) {
      order.orderDetails[i].pharmacyMedsStatus = true;
      await order.save();
      break;
    }
  }
  res.json(order);
});

// get all orders by customerId
router.get("/getOrders/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const orders = await airorder.find({ customerId: customerId });
  res.json(orders);
});

// get all  all order
router.get("/getOrders", async (req, res) => {
  const orders = await airorder.find();
  res.json(orders);
});

// router.get("/getPharmacyOrders/")
router.get("/findorder/:pharmacyId", async (req, res) => {
  const { pharmacyId } = req.params;
  try {
    const orders = await airorder.find({ pharmacyId: pharmacyId });
    console.log(orders);
    res.status(200).json(orders);
  } catch (error) {
    console.log(error.message, "server is not working");
    res.status(500).json("server is not working");
  }
});
// router.get("/getdelivary/")
router.get("/delivary/order/notify/:deliveryBoyId", async (req, res) => {
  const { deliveryBoyId } = req.params;
  try {
    const orders = await airorder.find({ deliveryBoyId: deliveryBoyId });
    console.log(orders);
    res.status(200).json(orders);
  } catch (error) {
    console.log(error.message, "server is not working");
    res.status(500).json("server is not working");
  }
});

// order otp api confim apis
router.post("/createfinalorder", async (req, res) => {
  const {
    orderId,
    totalPrice,
    quantity,
    customerId,
    customerName,
    customerPhone,
    status,
    orderDetails,
    paymentType,
    userLat,
    userLng,
    precriptionUrl,
    distance,
  } = req.body;
  const otpValue = Math.floor(1000 + Math.random() * 9000).toString();
  try {
    const newOrder = await finalorder.create({
      otpValue: otpValue,
      orderDetails: orderDetails,
      paymentType: paymentType,
      quantity: quantity,
      customerId: customerId,
      status: "Accepted",
      orderId: orderId,
      totalPrice: totalPrice,
      userLat: userLat,
      userLng: userLng,
      distance: distance,
      precriptionUrl: precriptionUrl,
      customerName: customerName,
      customerPhone: customerPhone,
    });
    newOrder.save();
    res.status(201).json({ message: "otp & payment type save" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Network not working" });
  }
});

router.post("/finalorder/send/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const {
    pharmacyId,
    pharmacyPhone,
    pharmacyName,
    totalPrice,
    deliveryBoyId,
    deliveryPrice,
    orderDetails,
    pharmacyLat,
    pharmacyLng,
    deliveryBoyLat,
    deliveryBoyLng,
    deliveryBoyName,
    deliveryBoyPhone,
    status,
    phamacydistance,
    delivarydistance,
    precriptionUrl,
    pharmacyPrice,
  } = req.body;
  try {
    const result = await finalorder.findOne({ orderId: orderId });
    if (result) {
      // Update properties only if they are provided in the request body
      if (pharmacyId !== undefined) result.pharmacyId = pharmacyId;
      if (pharmacyName !== undefined) result.pharmacyName = pharmacyName;
      if (pharmacyPhone !== undefined) result.pharmacyPhone = pharmacyPhone;
      if (pharmacyPrice !== undefined) result.pharmacyPrice = pharmacyPrice;
      if (pharmacyLat !== undefined) result.pharmacyLat = pharmacyLat;
      if (pharmacyLng !== undefined) result.pharmacyLng = pharmacyLng;
      if (totalPrice !== undefined) result.totalPrice = totalPrice;
      if (deliveryBoyId !== undefined) result.deliveryBoyId = deliveryBoyId;
      if (deliveryPrice !== undefined) result.deliveryPrice = deliveryPrice;
      if (orderDetails !== undefined) result.orderDetails = orderDetails;
      if (deliveryBoyLat !== undefined) result.deliveryBoyLat = deliveryBoyLat;
      if (deliveryBoyLng !== undefined) result.deliveryBoyLng = deliveryBoyLng;
      if (deliveryBoyName !== undefined)
        result.deliveryBoyName = deliveryBoyName;
      if (deliveryBoyPhone !== undefined)
        result.deliveryBoyPhone = deliveryBoyPhone;
      if (status !== undefined) result.status = status;
      if (phamacydistance !== undefined)
        result.phamacydistance = phamacydistance;
      if (delivarydistance !== undefined)
        result.delivarydistance = delivarydistance;
      if (precriptionUrl !== precriptionUrl)
        result.precriptionUrl = precriptionUrl;
      await result.save();
      res.status(200).json({ finalorder: result });
    } else {
      res.status(404).json({ message: "No matching order found" });
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});

//verify OTP order..............
router.post("/verifyotpOrder", async (req, res) => {
  const { otpValue, customerId, orderId } = req.body;
  try {
    const completedOrder = await finalorder.findOne({
      customerId,
      orderId,
      otpValue,
    });
    if (!completedOrder) {
      return res.status(400).json({ message: "OTP not found" });
    }
    if (otpValue === completedOrder.otpValue) {
      completedOrder.status = "Delivered";
      await completedOrder.save();
      res.status(200).json({
        finalorder: completedOrder,
        message: "otp verify successfully",
      });
      console.log(completedOrder, "order");
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error", error });
  }
});

router.get("/finalorder", async (req, res) => {
  const forder = await finalorder.find();
  res.status(200).json(forder);
});

router.get("/finalorder/:deliveryBoyId", async (req, res) => {
  const { deliveryBoyId } = req.params;
  const delivaryorder = await finalorder.find({ deliveryBoyId: deliveryBoyId });
  res.status(200).json(delivaryorder);
});

// get all orders by customerId
router.get("/getfinalorder/:customerId", async (req, res) => {
  const { customerId } = req.params;
  const orders = await finalorder.find({ customerId: customerId });
  res.json(orders);
});

router.get("/finalorder/:pharmacyId", async (req, res) => {
  const { pharmacyId } = req.params;
  const delivarorder = await finalorder.find({ pharmacyId: pharmacyId });
  res.status(200).json(delivarorder);
});

router.get("/findorderid/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const forder = await finalorder.findOne({ orderId });
    if (!forder) {
      return res.status(404).json({ error: "Order not found" });
    }
    res.status(200).json(forder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Network error" });
  }
});

module.exports = router;
