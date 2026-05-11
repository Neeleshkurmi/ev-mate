const { StatusCodes } = require("http-status-codes");
const { Prisma } = require("@prisma/client");

const prisma = require("../config/prisma");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const bookingRepository = require("../repositories/bookingRepository");
const { wouldExceedCapacity } = require("../utils/overlapValidator");
const eventBus = require("../aggregation/eventBus");
const {
  parseUtcDayBounds,
  computeFreeCapacitySegments,
  nextAvailableSlot,
  MS_PER_MINUTE,
} = require("./availabilityService");

const assertValidBookingWindow = (startTime, endTime, now) => {
  if (!(startTime instanceof Date) || Number.isNaN(startTime.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid startTime");
  }
  if (!(endTime instanceof Date) || Number.isNaN(endTime.getTime())) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid endTime");
  }
  if (endTime <= startTime) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "endTime must be after startTime");
  }
  if (startTime < now) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Cannot book a time range in the past");
  }
  const durationMs = endTime.getTime() - startTime.getTime();
  if (durationMs < env.BOOKING_MIN_DURATION_MS) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Booking duration must be at least ${env.BOOKING_MIN_DURATION_MS / MS_PER_MINUTE} minutes`
    );
  }
  if (durationMs > env.BOOKING_MAX_DURATION_MS) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Booking duration cannot exceed ${env.BOOKING_MAX_DURATION_MS / MS_PER_MINUTE} minutes`
    );
  }
};

const createBooking = async ({ userId, stationId, startTime, endTime }) => {
  const now = new Date();
  assertValidBookingWindow(startTime, endTime, now);

  const booking = await prisma.$transaction(
    async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM "Station" WHERE id = ${stationId} FOR UPDATE
      `;

      const station = await tx.station.findUnique({ where: { id: stationId } });
      if (!station) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
      }

      const overlapping = await bookingRepository.findOverlappingBooked(
        tx,
        stationId,
        startTime,
        endTime
      );

      const exceeds = wouldExceedCapacity(
        overlapping.map((b) => ({ start: b.startTime, end: b.endTime })),
        startTime,
        endTime,
        station.totalSlots
      );
      if (exceeds) {
        throw new ApiError(StatusCodes.CONFLICT, "Requested time slot is already booked");
      }

      return bookingRepository.createBooking(tx, {
        userId,
        stationId,
        startTime,
        endTime,
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  // Event-driven recompute: booking -> station aggregation -> socket broadcast.
  eventBus.emit("booking-created", {
    stationId,
    bookingId: booking.id,
  });

  return booking;
};

const cancelBooking = async ({ userId, bookingId }) => {
  const result = await prisma.$transaction(
    async (tx) => {
      const booking = await bookingRepository.findUserBookingById(tx, bookingId, userId);
      if (!booking) {
        throw new ApiError(StatusCodes.NOT_FOUND, "Booking not found");
      }
      if (booking.status !== "BOOKED") {
        throw new ApiError(StatusCodes.BAD_REQUEST, "Only active bookings can be cancelled");
      }

      await tx.$queryRaw`
        SELECT id FROM "Station" WHERE id = ${booking.stationId} FOR UPDATE
      `;

      await bookingRepository.cancelBookingById(tx, booking.id);
      return { stationId: booking.stationId, id: booking.id };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );

  // Event-driven recompute: booking -> station aggregation -> socket broadcast.
  eventBus.emit("booking-cancelled", {
    stationId: result.stationId,
    bookingId: result.id,
  });

  return result;
};

const getUserBookings = (userId) =>
  prisma.booking.findMany({
    where: { userId },
    include: { station: true },
    orderBy: { createdAt: "desc" },
  });

const getStationAvailabilitySummary = async (stationId, dateStr) => {
  const bounds = parseUtcDayBounds(dateStr);
  if (!bounds) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "date must be YYYY-MM-DD (UTC day bounds)");
  }
  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
  }

  const booked = await prisma.booking.findMany({
    where: {
      stationId,
      status: "BOOKED",
      startTime: { lt: bounds.dayEnd },
      endTime: { gt: bounds.dayStart },
    },
    select: { id: true, startTime: true, endTime: true, userId: true },
    orderBy: { startTime: "asc" },
  });

  const segments = computeFreeCapacitySegments(
    bounds.dayStart,
    bounds.dayEnd,
    booked,
    station.totalSlots
  );

  return {
    stationId,
    date: dateStr,
    totalSlots: station.totalSlots,
    bookedIntervals: booked.map((b) => ({
      id: b.id,
      startTime: b.startTime,
      endTime: b.endTime,
    })),
    freeSegments: segments.map((g) => ({
      start: g.start,
      end: g.end,
      freeConnectors: g.freeConnectors,
      usedSlots: g.usedSlots,
    })),
  };
};

const getStationFreeSlots = async (stationId, query) => {
  const bounds = parseUtcDayBounds(query.date);
  if (!bounds) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "date must be YYYY-MM-DD (UTC day bounds)");
  }
  const durationMs = (query.durationMinutes ?? 60) * MS_PER_MINUTE;
  const stepMs = (query.stepMinutes ?? 15) * MS_PER_MINUTE;

  const station = await prisma.station.findUnique({ where: { id: stationId } });
  if (!station) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
  }

  const booked = await prisma.booking.findMany({
    where: {
      stationId,
      status: "BOOKED",
      startTime: { lt: bounds.dayEnd },
      endTime: { gt: bounds.dayStart },
    },
    select: { startTime: true, endTime: true },
    orderBy: { startTime: "asc" },
  });

  const capacity = station.totalSlots;

  const slots = [];
  let t = bounds.dayStart.getTime();
  const end = bounds.dayEnd.getTime();
  while (t + durationMs <= end) {
    const slotStart = new Date(t);
    const slotEnd = new Date(t + durationMs);
    const overlapping = booked
      .filter((b) => b.startTime < slotEnd && b.endTime > slotStart)
      .map((b) => ({ start: b.startTime, end: b.endTime }));
    if (!wouldExceedCapacity(overlapping, slotStart, slotEnd, capacity)) {
      slots.push({ startTime: slotStart, endTime: slotEnd });
    }
    t += stepMs;
  }

  const segments = computeFreeCapacitySegments(
    bounds.dayStart,
    bounds.dayEnd,
    booked,
    station.totalSlots
  );
  const next = nextAvailableSlot(segments, durationMs, new Date());

  return {
    stationId,
    date: query.date,
    durationMinutes: query.durationMinutes ?? 60,
    stepMinutes: query.stepMinutes ?? 15,
    totalSlots: station.totalSlots,
    suggestedNextSlot: next,
    slots,
  };
};

module.exports = {
  createBooking,
  cancelBooking,
  getUserBookings,
  getStationAvailabilitySummary,
  getStationFreeSlots,
  assertValidBookingWindow,
};
