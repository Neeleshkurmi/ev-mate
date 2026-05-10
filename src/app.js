const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const hpp = require("hpp");

const routes = require("../routes");
const errorHandler = require("../middleware/errorHandler");
const notFound = require("../middleware/notFound");
const apiRateLimiter = require("../middleware/rateLimiter");
const requestLogger = require("../middleware/requestLogger");
const env = require("../config/env");

const app = express();

app.set("trust proxy", true);
app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL === "*" ? true : env.CLIENT_URL,
    credentials: true,
  })
);
app.use(compression());
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use("/api", apiRateLimiter);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "EV charging backend is healthy",
  });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
