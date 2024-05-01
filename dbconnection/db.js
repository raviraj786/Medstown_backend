const mongoose = require("mongoose");
const express = require("express");
require("dotenv").config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex : true,
});

const db = mongoose.connection;
db.once("open", (_) => {
  console.log("Database connected:");
});

db.on("error", (err) => {
  console.error("connection error:", err);
});