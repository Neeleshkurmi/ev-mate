const express = require("express");

const {
  createBooking,
  cancelBooking,
  getUserBookings,
} = require("../controllers/bookingController");
const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  createBookingSchema,
  bookingIdParamSchema,
} = require("../validations/bookingValidation");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  validateRequest(createBookingSchema),
  createBooking
);
router.delete(
  "/:id",
  authMiddleware,
  validateRequest(bookingIdParamSchema, "params"),
  cancelBooking
);
router.get("/user", authMiddleware, getUserBookings);

module.exports = router;
