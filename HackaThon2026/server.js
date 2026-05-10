const http = require("http");

const env = require("./config/env");
const app = require("./src/app");
const connectDB = require("./config/db");
const prisma = require("./config/prisma");
const setupSocket = require("./sockets");

const PORT = env.PORT;

const startServer = async () => {
  try {
    await connectDB();

    const server = http.createServer(app);
    const io = setupSocket(server);
    app.set("io", io);

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

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
