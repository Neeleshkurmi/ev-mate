const registerStationSocketHandlers = (io, socket) => {
  socket.on("join-station-room", (stationId) => {
    socket.join(`station-${stationId}`);
  });

  socket.on("leave-station-room", (stationId) => {
    socket.leave(`station-${stationId}`);
  });
};

const emitStationAvailabilityUpdate = (io, stationId, availableSlots) => {
  const payload = { stationId, availableSlots };

  io.emit("station-availability-updated", payload);
  io.to(`station-${stationId}`).emit("station-availability-updated", payload);
};

const emitSlotBooked = (io, stationId, booking) => {
  const payload = {
    stationId,
    bookingId: booking.id,
    slotTime: booking.slotTime,
    bookingStatus: booking.bookingStatus,
  };

  io.emit("slot-booked", payload);
  io.to(`station-${stationId}`).emit("slot-booked", payload);
};

const emitSlotCancelled = (io, stationId, bookingId) => {
  const payload = {
    stationId,
    bookingId,
    bookingStatus: "cancelled",
  };

  io.emit("slot-cancelled", payload);
  io.to(`station-${stationId}`).emit("slot-cancelled", payload);
};

module.exports = {
  registerStationSocketHandlers,
  emitStationAvailabilityUpdate,
  emitSlotBooked,
  emitSlotCancelled,
};
