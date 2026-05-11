const env = require("../../config/env");
const prisma = require("../../config/prisma");
const availabilityService = require("../../services/availabilityService");
const { getStationStateCache, setStationStateCache } = require("../cache/stationStateCache");

// Basic in-memory lock to prevent stampeding recomputes per station.
const recomputeLocks = new Map(); // stationId -> Promise

const MS_PER_MINUTE = 60 * 1000;

const alignUp = (t, stepMs) => {
  if (stepMs <= 0) return t;
  const rem = t % stepMs;
  return rem === 0 ? t : t + (stepMs - rem);
};

const slotIsFullyFree = (slotStart, slotEnd, segments) => {
  let t = slotStart.getTime();
  const end = slotEnd.getTime();

  // Ensure that at any point inside the interval, the time belongs to at least one free segment.
  while (t < end) {
    const seg = segments.find((s) => s.start.getTime() <= t && s.end.getTime() > t);
    if (!seg) return false;
    t = Math.min(end, seg.end.getTime());
  }
  return true;
};

const computeAvailableWindows = ({ now, stationTotalSlots, booked, horizonEnd }) => {
  const durationMs = env.AGGREGATION_WINDOW_DURATION_MINUTES * MS_PER_MINUTE;
  const stepMs = env.AGGREGATION_WINDOW_STEP_MINUTES * MS_PER_MINUTE;

  // Compute free segments once for the whole horizon.
  const segments = availabilityService.computeFreeCapacitySegments(
    now,
    horizonEnd,
    booked,
    stationTotalSlots
  );

  const alignedStart = new Date(alignUp(now.getTime(), stepMs));
  const windows = [];

  // Scan for the next few windows.
  let t = alignedStart.getTime();
  while (t + durationMs <= horizonEnd.getTime() && windows.length < 5) {
    const slotStart = new Date(t);
    const slotEnd = new Date(t + durationMs);

    // Ensure the whole window is within "free connector" segments.
    if (slotIsFullyFree(slotStart, slotEnd, segments)) {
      windows.push({ startTime: slotStart, endTime: slotEnd });
    }
    t += stepMs;
  }

  return windows;
};

const computeEstimatedWaitTimeSeconds = ({ now, availableWindows }) => {
  if (!availableWindows.length) return null;
  const nextStart = availableWindows[0].startTime.getTime();
  const diffMs = nextStart - now.getTime();
  return diffMs <= 0 ? 0 : Math.ceil(diffMs / 1000);
};

const deriveChargerStatus = ({ providerOnline, telemetry, totalSlots }) => {
  if (!providerOnline) return { chargerStatus: "OFFLINE", providerOnline, currentActiveSessions: 0 };

  const activeSessions = telemetry?.activeSessions ?? null;
  const providerStatus = telemetry?.chargerStatus ?? "UNKNOWN";

  // If we have activeSessions, infer busy/available.
  if (activeSessions !== null && typeof activeSessions === "number") {
    if (activeSessions >= totalSlots) {
      return {
        chargerStatus: "BUSY",
        providerOnline: true,
        currentActiveSessions: activeSessions,
      };
    }
    return {
      chargerStatus: activeSessions > 0 ? "BUSY" : "AVAILABLE",
      providerOnline: true,
      currentActiveSessions: activeSessions,
    };
  }

  return {
    chargerStatus: providerStatus,
    providerOnline: true,
    currentActiveSessions: telemetry?.activeSessions ?? 0,
  };
};

const computeStationState = async ({ stationId, io, prismaClient = prisma }) => {
  const now = new Date();
  const horizonEnd = new Date(now.getTime() + env.AGGREGATION_HORIZON_MINUTES * MS_PER_MINUTE);

  const station = await prismaClient.station.findUnique({ where: { id: stationId } });
  if (!station) return null;

  const totalSlots = Number(station.totalSlots);

  const telemetry = prismaClient.providerTelemetry
    ? await prismaClient.providerTelemetry.findFirst({
        where: { stationId },
        orderBy: { providerTimestamp: "desc" },
      })
    : null;

  const [activeBookings, bookedIntervals] = await Promise.all([
    prismaClient.booking.count({
      where: {
        stationId,
        status: "BOOKED",
        startTime: { lte: now },
        endTime: { gt: now },
      },
    }),
    prismaClient.booking.findMany({
      where: {
        stationId,
        status: "BOOKED",
        startTime: { lt: horizonEnd },
        endTime: { gt: now },
      },
      select: { startTime: true, endTime: true },
    }),
  ]);

  const liveBookedConnectors = activeBookings;
  const occupancyPercentage = totalSlots > 0 ? (liveBookedConnectors / totalSlots) * 100 : 0;

  const providerTimestamp = telemetry?.providerTimestamp ?? telemetry?.createdAt ?? null;
  const providerOnline = providerTimestamp ? now.getTime() - providerTimestamp.getTime() <= env.PROVIDER_STALE_MS : false;

  const { chargerStatus, currentActiveSessions } = deriveChargerStatus({
    providerOnline,
    telemetry,
    totalSlots,
  });

  const booked = bookedIntervals.map((b) => ({ startTime: b.startTime, endTime: b.endTime }));
  const availableWindows = computeAvailableWindows({
    now,
    stationTotalSlots: totalSlots,
    booked,
    horizonEnd,
  });

  const estimatedWaitTimeSeconds = computeEstimatedWaitTimeSeconds({ now, availableWindows });

  const state = {
    stationId,
    stationName: station.name,
    activeBookings,
    occupancyPercentage: Math.round(occupancyPercentage * 10) / 10,
    availableWindows: availableWindows.map((w) => ({
      startTime: w.startTime.toISOString(),
      endTime: w.endTime.toISOString(),
    })),
    estimatedWaitTimeSeconds,
    chargerStatus,
    providerOnline,
    currentActiveSessions,
    liveBookedConnectors,
    lastProviderTimestamp: providerTimestamp ? providerTimestamp.toISOString() : null,
    lastUpdated: now.toISOString(),
    // Future-ready placeholders for load metrics/utilization.
    bookingUtilization: totalSlots > 0 ? Math.round((activeBookings / totalSlots) * 1000) / 10 : 0,
  };

  return state;
};

const recomputeStationState = async ({
  stationId,
  io,
  emitStationStateUpdated,
  prismaClient = prisma,
  force = false,
}) => {
  const existing = recomputeLocks.get(stationId);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const cacheKey = `stationState:${stationId}`;
      if (!force) {
        const cached = await getStationStateCache(cacheKey);
        if (cached) {
          if (emitStationStateUpdated && io) {
            emitStationStateUpdated(io, stationId, cached);
          }
          return cached;
        }
      }

      const computed = await computeStationState({ stationId, io, prismaClient });
      if (!computed) return null;

      // Persist the latest computed station state.
      await prismaClient.$transaction(async (tx) => {
        await tx.stationState.upsert({
          where: { stationId },
          create: {
            stationId,
            activeBookings: computed.activeBookings,
            occupancyPercentage: computed.occupancyPercentage,
            availableWindows: computed.availableWindows,
            estimatedWaitTimeSeconds: computed.estimatedWaitTimeSeconds,
            chargerStatus: computed.chargerStatus,
            providerOnline: computed.providerOnline,
            currentActiveSessions: computed.currentActiveSessions,
            liveBookedConnectors: computed.liveBookedConnectors,
          bookingUtilization: computed.bookingUtilization,
            lastProviderTimestamp: computed.lastProviderTimestamp
              ? new Date(computed.lastProviderTimestamp)
              : null,
          },
          update: {
            activeBookings: computed.activeBookings,
            occupancyPercentage: computed.occupancyPercentage,
            availableWindows: computed.availableWindows,
            estimatedWaitTimeSeconds: computed.estimatedWaitTimeSeconds,
            chargerStatus: computed.chargerStatus,
            providerOnline: computed.providerOnline,
            currentActiveSessions: computed.currentActiveSessions,
            liveBookedConnectors: computed.liveBookedConnectors,
          bookingUtilization: computed.bookingUtilization,
            lastProviderTimestamp: computed.lastProviderTimestamp
              ? new Date(computed.lastProviderTimestamp)
              : null,
            lastUpdated: new Date(),
          },
        });

        await tx.aggregationSnapshot.create({
          data: {
            stationId,
            payload: computed,
          },
        });
      });

      if (emitStationStateUpdated && io) {
        emitStationStateUpdated(io, stationId, computed);
      }

      const cacheKey = `stationState:${stationId}`;
      await setStationStateCache(cacheKey, computed, env.STATION_STATE_CACHE_TTL_MS);

      return computed;
    } finally {
      recomputeLocks.delete(stationId);
    }
  })();

  recomputeLocks.set(stationId, promise);
  return promise;
};

module.exports = {
  recomputeStationState,
  computeStationState,
};

