const overlapWhereClause = (stationId, startTime, endTime) => ({
  stationId,
  status: "BOOKED",
  startTime: { lt: endTime },
  endTime: { gt: startTime },
});

const findOverlappingBooked = (tx, stationId, startTime, endTime) =>
  tx.booking.findMany({
    where: overlapWhereClause(stationId, startTime, endTime),
    select: { id: true, startTime: true, endTime: true },
  });

const createBooking = (tx, data) =>
  tx.booking.create({
    data: {
      userId: data.userId,
      stationId: data.stationId,
      startTime: data.startTime,
      endTime: data.endTime,
      status: "BOOKED",
    },
  });

const findBookingsToExpire = (tx, now) =>
  tx.booking.findMany({
    where: {
      status: "BOOKED",
      endTime: { lt: now },
    },
    select: { id: true, stationId: true, userId: true, startTime: true, endTime: true },
  });

const markBookingsExpired = (tx, ids) =>
  tx.booking.updateMany({
    where: { id: { in: ids } },
    data: { status: "EXPIRED" },
  });

const findUserBookingById = (tx, id, userId) =>
  tx.booking.findFirst({
    where: { id, userId },
  });

const cancelBookingById = (tx, id) =>
  tx.booking.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

const groupLiveBookingsByStation = (prismaClient, now) =>
  prismaClient.booking.groupBy({
    by: ["stationId"],
    where: {
      status: "BOOKED",
      startTime: { lte: now },
      endTime: { gt: now },
    },
    _count: { _all: true },
  });

module.exports = {
  findOverlappingBooked,
  createBooking,
  findBookingsToExpire,
  markBookingsExpired,
  findUserBookingById,
  cancelBookingById,
  groupLiveBookingsByStation,
};
