const prisma = require("../config/prisma");
const env = require("../config/env");
const eventBus = require("../aggregation/eventBus");

/**
 * Detect providers that have not reported in PROVIDER_STALE_MS and trigger recompute.
 * Event-driven: emits `provider-stale-detected` per stationId.
 */
const startProviderStaleScheduler = () => {
  const intervalMs = env.PROVIDER_STALE_CHECK_INTERVAL_MS;

  const timer = setInterval(async () => {
    try {
      const now = new Date();

      const staleStations = await prisma.stationState.findMany({
        where: {
          providerOnline: true,
          // now - lastProviderTimestamp > staleMs
          lastProviderTimestamp: {
            not: null,
            lt: new Date(now.getTime() - env.PROVIDER_STALE_MS),
          },
        },
        select: { stationId: true },
        take: 500,
      });

      for (const row of staleStations) {
        eventBus.emit("provider-stale-detected", { stationId: row.stationId });
      }
    } catch (err) {
      console.error("[providerStaleScheduler] failed:", err.message);
    }
  }, intervalMs);

  if (typeof timer.unref === "function") timer.unref();

  return () => clearInterval(timer);
};

module.exports = {
  startProviderStaleScheduler,
};

