const dotenv = require("dotenv");

dotenv.config();

const requiredVars = ["DATABASE_URL", "JWT_SECRET", "GOOGLE_MAPS_API_KEY"];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

const minute = 60 * 1000;

module.exports = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT) || 5000,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  CLIENT_URL: process.env.CLIENT_URL || "*",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 200,
  BOOKING_MIN_DURATION_MS: Number(process.env.BOOKING_MIN_DURATION_MS) || 15 * minute,
  BOOKING_MAX_DURATION_MS: Number(process.env.BOOKING_MAX_DURATION_MS) || 8 * 60 * minute,
  BOOKING_EXPIRY_INTERVAL_MS:
    Number(process.env.BOOKING_EXPIRY_INTERVAL_MS) || 60 * 1000,
  PROVIDER_STALE_MS: Number(process.env.PROVIDER_STALE_MS) || 3 * 60 * 1000,
  AGGREGATION_HORIZON_MINUTES:
    Number(process.env.AGGREGATION_HORIZON_MINUTES) || 6 * 60,
  AGGREGATION_WINDOW_DURATION_MINUTES:
    Number(process.env.AGGREGATION_WINDOW_DURATION_MINUTES) || 60,
  AGGREGATION_WINDOW_STEP_MINUTES:
    Number(process.env.AGGREGATION_WINDOW_STEP_MINUTES) || 15,
  STATION_STATE_CACHE_TTL_MS: Number(process.env.STATION_STATE_CACHE_TTL_MS) || 5000,
  PROVIDER_STALE_CHECK_INTERVAL_MS:
    Number(process.env.PROVIDER_STALE_CHECK_INTERVAL_MS) || 60 * 1000,
};