const { Server } = require("socket.io");
const env = require("../config/env");
const {
  registerStationSocketHandlers,
} = require("./handlers/stationSocketHandler");

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    registerStationSocketHandlers(io, socket);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
  return io;
};

module.exports = setupSocket;
