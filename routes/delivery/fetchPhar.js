const express = require("express");
const router = express.Router();
const axios = require("axios");
const pharmacydb = require("../../models/pharmacydb/registerpharmacydb.js");
const deliverydb = require("../../models/deliverydb/deliveryuser.js");
require("dotenv").config();
const  { Expo } = require("expo-server-sdk");

router.post("/fetchpharmacy", async (req, res) => {
  const { lat, lng } = req.body;
  const options = {
    location: {
      $geoWithin: {
        $centerSphere: [[lng, lat], 30 / 3963.2], //how many kilometers to search for pharmacies around the user location
      },
    },
  };
  try {
    const pharmacies = await pharmacydb.find(options);
    const resData = [];
    if (pharmacies.length > 0) {
      for (let i = 0; i < pharmacies.length; i++) {
        resData.push({
          pharmacyId: pharmacies[i].pharmacyId,
          pharmacyName: pharmacies[i].bussinessName,
          location: pharmacies[i].location,
        });
      }
      res.json(resData);
    }
    else {
        res.json("No pharmacies found");
    }
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

// update delivery boy location
router.post("/updatedeliveryboylocation", async (req, res) => {
  const { lat, lng, partnerId } = req.body;
  try {
    const deliveryBoy = await deliverydb.findOneAndUpdate(
      { partnerId: partnerId },
      {
        $set: {
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
        }, 
      }
    );
    res.json({
      status: "success",
      message: "Location updated successfully",
      location: deliveryBoy.location,
    });
  } catch (err) {
    console.log(err);
    res.json(err);
  }
});

//send order to delivery boy
router.post("/sendorder", async (req, res) => {
  const {lat,lng,pharmacyId,orderId,pharmacyName} = req.body;

  const notificationDetails = [];
    const options = {
      location: {
        $geoWithin: {
          $centerSphere: [[lng, lat], 30 / 3963.2],
        },
      },
    };
    const deliveryBoys = await deliverydb.find(options);
    const arr = [];
    if (deliveryBoys.length > 0) {
      console.log(deliveryBoys);
      console.log(deliveryBoys);
      for(let i=0;i<deliveryBoys.length;i++){
        console.log(deliveryBoys[i].location.coordinates[1])
        console.log(deliveryBoys[i].location.coordinates[0])
        const url = 'https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins='+lng+','+lat+'&destinations='+deliveryBoys[i].location.coordinates[0]+','+deliveryBoys[i].location.coordinates[1]+'&key='+process.env.GOOGLE_MAPS_API_KEY+'&mode=driving';
        console.log(url)
        await axios.get(url).then((response)=>{
          console.log(response.data.rows[0].elements[0])
          arr.push(response.data.rows[0].elements[0].distance.value);
          arr[i] = arr[i]/1000;
        })
        .catch((err)=>{
          console.log(err)
        })
        notificationDetails.push({
          partnerId: deliveryBoys[i].partnerId,
          distance: arr[i],
          pharmacyName: pharmacyName,
          expoToken: deliveryBoys[i].expoToken,
        });
        const expo = new Expo();
        const chunks = expo.chunkPushNotifications([
          {
            to: notificationDetails[i].expoToken,
            sound: "default",
            title: "New Order",
            body: "You have a new order to deliver",
            data: { orderData: notificationDetails[i]},
          },
        ]);
        const tickets = [];
        let notifsent = false;
        (async () => {
          for (const chunk of chunks) {
            try {
              const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
              console.log(ticketChunk);
              tickets.push(...ticketChunk);
              notifsent = true;
              console.log(tickets);
            } catch (error) {
              console.error(error , "error in notification");
            }
          }
        }
        )();
      }
    }
});

module.exports = router;
 