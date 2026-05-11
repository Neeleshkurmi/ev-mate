const bookingRepository = require("../repositories/bookingRepository");

const DEFAULT_INTERVAL_MS = 60 * 1000;
const eventBus = require("../aggregation/eventBus");

const buildExpiryJob =
  ({ prisma: prismaClient } = {}) =>
  async () => {
    const prisma = prismaClient || require("../config/prisma");
    const now = new Date();
    const expiredRows = await prisma.$transaction(async (tx) => {
      const rows = await bookingRepository.findBookingsToExpire(tx, now);
      if (!rows.length) return [];
      await bookingRepository.markBookingsExpired(
        tx,
        rows.map((r) => r.id)
      );
      return rows;
    });

    if (!expiredRows.length) return;

    const stations = new Set();
    for (const row of expiredRows) {
      stations.add(row.stationId);
    }
    for (const stationId of stations) {
      eventBus.emit("booking-expired", { stationId });
    }
  };

/**
 * Background expiry job. Interval from env BOOKING_EXPIRY_INTERVAL_MS (default 60s).
 * @returns {() => void} stop function
 */
const startBookingScheduler = (options = {}) => {
  const intervalMs = Number(process.env.BOOKING_EXPIRY_INTERVAL_MS) || DEFAULT_INTERVAL_MS;
  const job = buildExpiryJob(options);
  const timer = setInterval(() => {
    job().catch((err) => {
      console.error("[bookingScheduler] expiry job failed:", err.message);
    });
  }, intervalMs);
  if (typeof timer.unref === "function") timer.unref();

  job().catch((err) => {
    console.error("[bookingScheduler] initial expiry run failed:", err.message);
  });

  return () => clearInterval(timer);
};

module.exports = {
  startBookingScheduler,
  buildExpiryJob,
};
