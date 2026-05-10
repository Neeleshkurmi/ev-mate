const express = require("express");

const authRoutes = require("./authRoutes");
const stationRoutes = require("./stationRoutes");
const bookingRoutes = require("./bookingRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/stations", stationRoutes);
router.use("/bookings", bookingRoutes);

module.exports = router;
