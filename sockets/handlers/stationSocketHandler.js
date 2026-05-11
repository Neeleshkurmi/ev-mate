const registerStationSocketHandlers = (io, socket) => {
  socket.on("join-station-room", (stationId) => {
    socket.join(`station-${stationId}`);
  });

  socket.on("leave-station-room", (stationId) => {
    socket.leave(`station-${stationId}`);
  });
};

const emitStationStateUpdated = (io, stationId, stationState) => {
  // Emit ONLY computed aggregated station state.
  io.emit("station-state-updated", stationState);
  io.to(`station-${stationId}`).emit("station-state-updated", stationState);
};

module.exports = {
  registerStationSocketHandlers,
  emitStationStateUpdated,
};
