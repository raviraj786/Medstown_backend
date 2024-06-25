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
    // Search for pharmacies
    const pharmacies = await pharmacydb.find(options);
    res.status(200).json(pharmacies);
  } catch (error) {
    console.log(error, "NO PHARMACIES FOUND");
    res.status(500).json({ success: false, error: "Internal server error" });
  }
});




// SHOW Delivery

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

// router.post("/orderMedicine", async (req, res) => {
//   const { customerId, orderDetails, price, quantity, lat, lng, orderId,totalPrice } =
//     req.body;
//   const options = {
//     location: {
//       $geoWithin: {
//         $centerSphere: [[lng, lat], 30 / 3963.2],
//       },
//     },
//   };
//   const pharmacies = await pharmacydb.find(options);
//   const arr = [];
//   const orderData = [];
//   if (pharmacies.length === 0) {
//     res.json({ message: "NO PHARMACIES FOUND" });
//     return;
//   }
//   for (let i = 0; i < pharmacies.length; i++) {
//     const url =
//       "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=" +
//       lng +
//       "," +
//       lat +
//       "&destinations=" +
//       pharmacies[i].location.coordinates[0] +
//       "," +
//       pharmacies[i].location.coordinates[1] +
//       "&key=" +
//       process.env.GOOGLE_MAPS_API_KEY +
//       "&mode=driving";
//     console.log(url, "url");
//     await axios
//       .get(url)
//       .then((response) => {
//         console.log(
//           response.data.rows[0].elements[0].distance.value,
//           "response"
//         );
//         arr.push(response.data.rows[0].elements[0].distance.value);
//         arr[i] = arr[i] / 1000;
//       })
//       .catch((err) => {
//         console.log(err);
//       });
//     orderData.push([
//       {
//         pharmacyId: pharmacies[i].pharmacyId,
//         distance: arr[i],
//         expoToken: pharmacies[i].expoToken,
//       },
//       {
//         price: price,
//         quantity: quantity,
//         orderDetails: orderDetails,
//         customerId: customerId,
//         orderStatus: "pending",
//         orderId: "order" + orderId,
//         totalPrice: totalPrice,
//       },
//     ]);
//   }
//   for (let i = 0; i < orderData.length; i++) {
//     setTimeout(async function timer() {
//       const order = await airorder.findOne({
//         orderId: orderData[i][1].orderId,
//       });
//       if (
//         order &&
//         order.orderId != null &&
//         orderData[i][1].orderId === order.orderId
//       ) {
//         if (order.orderNature === true) {
//           res.json({
//             message:
//               "ORDER ALREADY ACCEPTED NOT SENDING NOTIFICATION TO OTHER PHARMACIES",
//           });
//           return;
//         }
//       }
//       console.log("ENTERED IN ELSE");
//       const expo = new Expo();
//       const messages = [];
//       const chunks = expo.chunkPushNotifications([
//         {
//           to: orderData[i][0].expoToken,
//           sound: "default",
//           title: "New Order",
//           body: "You have a new order from customer",
//           data: { orderData: orderData[i][1] },
//         },
//       ]);
//       const tickets = [];
//       (async () => {
//         for (let chunk of chunks) {
//           try {
//             const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
//             tickets.push(...ticketChunk);
//             await airorder.create({
//               orderId: orderData[i][1].orderId,
//               orderDetails: orderData[i][1].orderDetails,
//               price: orderData[i][1].price,
//               quantity: orderData[i][1].quantity,
//               customerId: orderData[i][1].customerId,
//               pharmacyId: orderData[i][0].pharmacyId,
//               orderStatus: orderData[i][1].orderStatus,
//               totalPrice: orderData[i][1].price * orderData[i][1].quantity,
//             });
//             for (let ticket of tickets) {
//               if (ticket.status === "error") {
//                 console.log("NOTIFICATION NOT SENT");
//                 if (ticket.details) {
//                   console.error(`The error code is ${ticket.details.error}`);
//                 }
//               }
//             }
//           } catch (error) {
//             console.error(error);
//           }
//         }
//       })();
//     }, i * 10000);
//   }
// });

router.post("/orderMedicine", async (req, res) => {
  const {
    customerId,
    orderDetails,
    price,
    quantity,
    lat,
    lng,
    orderId,
    totalPrice,
  } = req.body;
  const options = {
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], 30 / 3963.2],
      },
    },
  };
  const pharmacies = await pharmacydb.find(options);
  console.log("phar", pharmacies);
  const arr = [];
  const orderData = [];
  if (pharmacies.length === 0) {
    res.json({ message: "NO PHARMACIES FOUND" });
    return;
  }
  for (let i = 0; i < pharmacies.length; i++) {
    const url =
      "https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=" +
      lng +
      "," +
      lat +
      "&destinations=" +
      pharmacies[i].location.coordinates[0] +
      s;
    "," +
      pharmacies[i].location.coordinates[1] +
      "&key=" +
      process.env.GOOGLE_MAPS_API_KEY +
      "&mode=driving";
    await axios
      .get(url)
      .then((response) => {
        arr.push(response.data.rows[0].elements[0].distance.value);
        arr[i] = arr[i] / 1000;
      })
      .catch((err) => {
        console.log(err);
      });
    orderData.push([
      {
        pharmacyId: pharmacies[i].pharmacyId,
        distance: arr[i],
        expoToken: pharmacies[i].expoToken,
      },
      {
        price: price,
        quantity: quantity,
        orderDetails: orderDetails,
        customerId: customerId,
        orderStatus: "pending",
        orderId: orderId,
        totalPrice: totalPrice,
        userLat: lat,
        userLng: lng,
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
            res.json({
              message:
                "ORDER ALREADY ACCEPTED NOT SENDING NOTIFICATION TO OTHER PHARMACIES",
            });
            return;
          }
        }
        const expo = new Expo();
        const messages = [];
        const chunks = expo.chunkPushNotifications([
          {
            to: orderData[i][0].expoToken,
            sound: "default",
            title: "New Order",
            body: "You have a new order from customer",
            data: { orderData: orderData[i][1] },
          },
        ]);
        const tickets = [];
        (async () => {
          for (let chunk of chunks) {
            try {
              const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
              tickets.push(...ticketChunk);
              await airorder.create({
                orderId: orderData[i][1].orderId,
                orderDetails: orderData[i][1].orderDetails,
                price: orderData[i][1].price,
                quantity: orderData[i][1].orderDetails.length,
                customerId: orderData[i][1].customerId,
                pharmacyId: orderData[i][0].pharmacyId,
                orderStatus: orderData[i][1].orderStatus,
                totalPrice: orderData[i][1].totalPrice,
                userLat: orderData[i][1].userLat,
                userLng: orderData[i][1].userLng,
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
        })();
        resolve();
      }, i * 10000);
    });
  });

  Promise.all(orderPromises)
    .then(() => {
      res.json({ message: "Order has been sent to the pharmacy" });
    })
    .catch((err) => {
      console.error(err);
      res
        .status(500)
        .json({ message: "An error occurred while processing the orders" });
    });
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
    } = req.body;
    // Input Validation

    const options = {
      location: {
        $geoWithin: {
          $centerSphere: [[lat, lng], 30 / 3963.2],
        },
      },
    };
    const pharmacies = await pharmacydb.find(options);
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
          response.data.rows &&
          response.data.rows.length > 0 &&
          response.data.rows[0].elements &&
          response.data.rows[0].elements.length > 0 &&
          response.data.rows[0].elements[0].distance &&
          response.data.rows[0].elements[0].distance.value
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
            orderStatus: "pending",
            orderId,
            totalPrice,
            userLat: lat,
            userLng: lng,
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
          await airorder.create(data);
          console.log(data.distance, "new data");
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
    console.error("An error occurred:", error);
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

// check order accepted or not using order id
router.post("/checkOrderAccepted", async (req, res) => {
  const { orderId } = req.body;
  const order = await airorder.findOne({
    orderId: orderId,
  });
  if (order) {
    console.log(order.status);
    if (order.status === "pending") {
      res.json({
        message: "Order is pending we will notify you when it is accepted",
        status: "pending",
      });
    } else if (order.status === "accepted") {
      res.json({
        message: "Order is accepted",
        status: "accepted",
      });
    } else if (order.status === "rejected") {
      res.json({
        message: "Order is rejected",
        status: "rejected",
      });
    }
  } else {
    res.json({ message: "NO ORDER FOUND" });
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
  console.log(req.body);
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
  console.log(deliveryBoy);
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
        deliveryBoyId: deliveryBoy[i].deliveryBoyId,
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
              orderStatus: "pending",
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
  console.log("Ssjskks", req.params);
  try {
    const orders = await airorder.find({ pharmacyId: pharmacyId });
    console.log(orders);
    res.status(200).json(orders);
  } catch (error) {
    console.log(error.message, "server is not working");
    res.status(500).json("server is not working");
  }
});

// order otp api confim apis

router.post("/createotp", async (req, res) => {
  const { customerId, orderId, paymentType } = req.body;
  if (!customerId || !orderId) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  const otpValue = Math.floor(1000 + Math.random() * 9000).toString();
  try {
    const otp = new finalorder({
      customerId: customerId,
      orderId: orderId,
      otpValue: otpValue,
      paymentType,
    });
    await otp.save(); // Save OTP in the database
    console.log("OTP created:", otpValue);
    res.status(200).json({ otp: otpValue });
  } catch (error) {
    console.error("Error creating OTP:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/finalorder/send/:orderId", async (req, res) => {
  console.log("Received a request to update order");
  const { orderId } = req.params;
  console.log("Order ID:", orderId);
  const {
    pharmacyId,
    totalPrice,
    deliveryBoyId,
    deliveryPrice,
    orderDetails,
    userLat,
    userLng,
    pharmacyLat,
    pharmacyLng,
    deliveryBoyLat,
    deliveryBoyLng,
    deliveryBoyName,
    deliveryBoyPhone,
    status,
    phamacydistance,
    delivarydistance,
    precriptionUrl 
  } = req.body;

  try {
    const result = await finalorder.findOne({ orderId: orderId });
    console.log("Order found:", result);

    if (result) {
      // Update properties only if they are provided in the request body
      if (pharmacyId !== undefined) result.pharmacyId = pharmacyId;
      if (totalPrice !== undefined) result.totalPrice = totalPrice;
      if (deliveryBoyId !== undefined) result.deliveryBoyId = deliveryBoyId;
      if (deliveryPrice !== undefined) result.deliveryPrice = deliveryPrice;
      if (orderDetails !== undefined) result.orderDetails = orderDetails;
      if (userLat !== undefined) result.userLat = userLat;
      if (userLng !== undefined) result.userLng = userLng;
      if (pharmacyLat !== undefined) result.pharmacyLat = pharmacyLat;
      if (pharmacyLng !== undefined) result.pharmacyLng = pharmacyLng;
      if (deliveryBoyLat !== undefined) result.deliveryBoyLat = deliveryBoyLat;
      if (deliveryBoyLng !== undefined) result.deliveryBoyLng = deliveryBoyLng;
      if (deliveryBoyName !== undefined) result.deliveryBoyName = deliveryBoyName;
      if (deliveryBoyPhone !== undefined) result.deliveryBoyPhone = deliveryBoyPhone;
      if (status !== undefined) result.status = status;
      if ( phamacydistance !== undefined) result.phamacydistance =  phamacydistance;
      if ( delivarydistance !== undefined) result.delivarydistance =  delivarydistance;
      if ( precriptionUrl  !== precriptionUrl ) result.precriptionUrl  =  precriptionUrl ;
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
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    // console.error("Error verifying OTP:", error);
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
  const orders = await  finalorder.find({ customerId: customerId });
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
      return res.status(404).json({ error: 'Order not found' });
    }
    res.status(200).json(forder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Network error' });
  }
});




module.exports = router;



