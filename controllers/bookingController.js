const { StatusCodes } = require("http-status-codes");

const asyncHandler = require("../utils/asyncHandler");
const bookingService = require("../services/bookingService");

const createBooking = asyncHandler(async (req, res) => {
  const { stationId, startTime, endTime } = req.body;

  const booking = await bookingService.createBooking({
    userId: req.user.id,
    stationId,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Booking successful",
    data: booking,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await bookingService.cancelBooking({
    userId: req.user.id,
    bookingId: id,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Booking cancelled successfully",
  });
});

const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getUserBookings(req.user.id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "User bookings fetched successfully",
    data: bookings,
  });
});

module.exports = {
  createBooking,
  cancelBooking,
  getUserBookings,
};
