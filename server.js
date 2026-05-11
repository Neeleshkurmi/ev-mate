const http = require("http");

const env = require("./config/env");
const app = require("./src/app");
const connectDB = require("./config/db");
const prisma = require("./config/prisma");
const setupSocket = require("./sockets");
const runMigrations = require("./utils/runMigrations");
const { seedBhopalStations } = require("./seeds/seedBhopalStations");
const { startBookingScheduler } = require("./schedulers/bookingScheduler");
const { startAggregationEventHandlers } = require("./aggregation/registerEventHandlers");
const { startProviderStaleScheduler } = require("./schedulers/providerStaleScheduler");

const PORT = env.PORT;
let server;

const startServer = async () => {
  try {
    await connectDB();
    await runMigrations();
    await seedBhopalStations();

    server = http.createServer(app);
    const io = setupSocket(server);
    app.set("io", io);

    startAggregationEventHandlers({ io });
    startBookingScheduler();
    startProviderStaleScheduler();

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error.message);
  process.exit(1);
});

const gracefulShutdown = async () => {
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

startServer();
