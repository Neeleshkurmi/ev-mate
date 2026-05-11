const express = require("express");

const authRoutes = require("./authRoutes");
const stationRoutes = require("./stationRoutes");
const bookingRoutes = require("./bookingRoutes");
const providerRoutes = require("./providerRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/stations", stationRoutes);
router.use("/bookings", bookingRoutes);
router.use("/providers", providerRoutes);

module.exports = router;
