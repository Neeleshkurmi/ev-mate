const { StatusCodes } = require("http-status-codes");

const asyncHandler = require("../utils/asyncHandler");
const bookingService = require("../services/bookingService");

const getStationAvailability = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const data = await bookingService.getStationAvailabilitySummary(req.params.id, date);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Station availability computed successfully",
    data,
  });
});

const getStationFreeSlots = asyncHandler(async (req, res) => {
  const { date, durationMinutes, stepMinutes } = req.query;
  const data = await bookingService.getStationFreeSlots(req.params.id, {
    date,
    durationMinutes: durationMinutes !== undefined ? Number(durationMinutes) : undefined,
    stepMinutes: stepMinutes !== undefined ? Number(stepMinutes) : undefined,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Free slot windows generated successfully",
    data,
  });
});

module.exports = {
  getStationAvailability,
  getStationFreeSlots,
};
