const { StatusCodes } = require("http-status-codes");
const { Prisma } = require("@prisma/client");

const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const {
  emitStationAvailabilityUpdate,
  emitSlotBooked,
  emitSlotCancelled,
} = require("../sockets/handlers/stationSocketHandler");

const createBooking = asyncHandler(async (req, res) => {
  const { stationId, slotTime } = req.body;

  if (!stationId || !slotTime) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "stationId and slotTime are required"
    );
  }

  const parsedSlotTime = new Date(slotTime);
  if (Number.isNaN(parsedSlotTime.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid slotTime format");
  }

  const { updatedStation, booking } = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`
        SELECT id
        FROM "Station"
        WHERE id = ${stationId}
        FOR UPDATE
      `;

      const stationDoc = await tx.station.findUnique({ where: { id: stationId } });
      if (!stationDoc) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
      }
      if (stationDoc.availableSlots <= 0) {
        throw new ApiError(StatusCodes.BAD_REQUEST, "No slots available");
      }

      const existingBooking = await tx.booking.findFirst({
        where: {
          stationId,
          slotTime: parsedSlotTime,
          bookingStatus: "booked",
        },
      });
      if (existingBooking) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          "This slot is already booked for the selected station"
        );
      }

      const booking = await tx.booking.create({
        data: {
          userId: req.user.id,
          stationId,
          slotTime: parsedSlotTime,
          bookingStatus: "booked",
        },
      });
      const updatedStation = await tx.station.update({
        where: { id: stationId },
        data: { availableSlots: { decrement: 1 } },
      });
      return { updatedStation, booking };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );

  const io = req.app.get("io");
  if (io && updatedStation) {
    emitSlotBooked(io, updatedStation.id, booking);
    emitStationAvailabilityUpdate(
      io,
      updatedStation.id,
      updatedStation.availableSlots
    );
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Booking successful",
    data: booking,
  });
});

const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { updatedStation, cancelledBookingId, cancelledStationId } = await prisma.$transaction(
    async (tx) => {
      const booking = await tx.booking.findFirst({
        where: {
          id,
          userId: req.user.id,
        },
      });
      if (!booking) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found");
      }
      if (booking.bookingStatus === "cancelled") {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Booking is already cancelled");
      }

      await tx.$queryRaw`
        SELECT id
        FROM "Station"
        WHERE id = ${booking.stationId}
        FOR UPDATE
      `;
      const station = await tx.station.findUnique({
        where: { id: booking.stationId },
      });
      if (!station) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
      }

      await tx.booking.update({
        where: { id: booking.id },
        data: { bookingStatus: "cancelled" },
      });
      const updatedStation = await tx.station.update({
        where: { id: station.id },
        data: {
          availableSlots: Math.min(station.totalSlots, station.availableSlots + 1),
        },
      });

      return {
        updatedStation,
        cancelledBookingId: booking.id,
        cancelledStationId: booking.stationId,
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );

  const io = req.app.get("io");
  if (io && updatedStation) {
    emitSlotCancelled(io, cancelledStationId, cancelledBookingId);
    emitStationAvailabilityUpdate(
      io,
      updatedStation.id,
      updatedStation.availableSlots
    );
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Booking cancelled successfully",
  });
});

const getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: { station: true },
    orderBy: { createdAt: "desc" },
  });

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
