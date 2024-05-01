const express = require('express');
const router = express.Router();
const pharmacydb = require('../../models/pharmacydb/registerpharmacydb.js'); // Assuming you have a pharmacy model
const orderdb = require('../../models/orders/airorder.js'); // Assuming you have an order model
const  { Expo } = require("expo-server-sdk");
const axios = require("axios");
require("dotenv").config();
const {Client} = require("@googlemaps/google-maps-services-js");

router.post("/orderMedicinenew", async (req, res) => {
  const { customerId , orders , lat , lng } = req.body;
  
  const options = {
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], 5 / 3963.2], // 5 miles  = 8.04672 km
      },
    },
  };

  const pharmacies = await pharmacydb.find(options);
  console.log(pharmacies);
  if(pharmacies.length === 0){
    return res.status(404).json({message: "NO PHARMACIES FOUND"});
  }
  let orderResponses = [];
  for(let order of orders){
    let orderAccepted = false;
    for(let i=0;i<pharmacies.length;i++){
      const url = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins='+lng+','+lat+'&destinations='+pharmacies[i].location.coordinates[0]+','+pharmacies[i].location.coordinates[1]+'&key='+process.env.GOOGLE_MAPS_API_KEY+'&mode=driving';
      const response = await axios.get(url);
      const distance = response.data.rows[0].elements[0].distance.value;
      console.log(distance,"distance");
      if(distance <= 5000){ // 5 km
        console.log("Pharmacy found");
        const newOrder = new orderdb({
          customerId: customerId,
          orderDetails: order.orderDetails,
          price: order.price,
          quantity: order.quantity,
          pharmacyId: pharmacies[i].pharmacyId,
          orderId: order.orderId,
          status: 'pending'
        });
        await newOrder.save();
        orderAccepted = true;
        console.log("Sending order to pharmacy");
        await sendOrderToPharmacy(pharmacies[i], newOrder);
        break;
      }
      // Wait for 1.5 minutes
      await new Promise(resolve => setTimeout(resolve, 90000));
    }
    orderResponses.push({orderId: order.orderId, accepted: orderAccepted});
  }
  res.json(orderResponses);
});

let expo = new Expo();

async function sendOrderToPharmacy(pharmacy, order){
  // Create a new order in the database
  console.log("Sending order to pharmacy");
  const newOrder = new orderdb({
    customerId: order.customerId,
    orderDetails: order.orderDetails,
    price: order.price,
    quantity: order.quantity,
    pharmacyId: pharmacy.pharmacyId,
    orderId: order.orderId,
    status: 'pending'
  });
  await newOrder.save();

  // Create the message that you want to send to the pharmacy
  console.log(pharmacy , "pharmacy.expoToken");
  let message = {
    to: pharmacy.expoToken,
    sound: 'default',
    body: 'New order received',
    data: { order: newOrder },
  };

  // Check that all your push tokens appear to be valid Expo push tokens
  if (!Expo.isExpoPushToken(message.to)) {
    console.error(`Push token ${message.to} is not a valid Expo push token`);
    return;
  }

  // Send the push notification
  let chunks = expo.chunkPushNotifications([message]);
  let tickets = [];
  for (let chunk of chunks) {
    try {
      console.log("Sending notification to pharmacy");
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }
  // Check if the pharmacy accepted the order
  if(response.data.accepted){
    // Update the order status in the database
    newOrder.status = 'accepted';
    await newOrder.save();
    return {accepted: true};
  } else {
    return {accepted: false};
  }
}
// get all orders
router.post("/acceptOrder", async (req, res) => {
    const { orderId } = req.body;
    const order = await orderdb.findOne({ orderId: orderId });
    if(!order){
      return res.status(404).json({message: "Order not found"});
    }
    order.status = 'accepted';
    await order.save();
    res.json({message: "Order accepted"});
  });

// get all orders paginated
router.get("/getorders/:page", async (req, res) => {
  const { page } = req.params;
  try{
  const orders = await orderdb.find().skip((page-1)*10).limit(10);
  orders.reverse();
  res.json(orders);
  }
  catch(err){
    res.json({message: err});
  }
});

module.exports = router;