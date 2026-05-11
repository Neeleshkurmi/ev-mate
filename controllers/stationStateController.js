const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const prisma = require("../config/prisma");
const { recomputeStationState } = require("../aggregation/stationStateEngine/stationStateEngine");
const { emitStationStateUpdated } = require("../sockets/handlers/stationSocketHandler");
const env = require("../config/env");

const toApiState = (row) => {
  if (!row) return null;
  return {
    stationId: row.stationId,
    stationName: row.station?.name ?? undefined,
    activeBookings: row.activeBookings,
    occupancyPercentage: row.occupancyPercentage,
    bookingUtilization: row.bookingUtilization,
    availableWindows: row.availableWindows,
    estimatedWaitTimeSeconds: row.estimatedWaitTimeSeconds,
    chargerStatus: row.chargerStatus,
    providerOnline: row.providerOnline,
    currentActiveSessions: row.currentActiveSessions,
    lastUpdated: row.lastUpdated?.toISOString?.() ?? new Date(row.lastUpdated).toISOString(),
    lastProviderTimestamp: row.lastProviderTimestamp
      ? row.lastProviderTimestamp.toISOString?.() ?? new Date(row.lastProviderTimestamp).toISOString()
      : null,
  };
};

const getStationState = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const io = req.app.get("io");

  // Latest state row.
  const existing = await prisma.stationState.findFirst({
    where: { stationId: id },
    orderBy: { lastUpdated: "desc" },
    include: { station: true },
  });

  if (existing) {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: "Station state fetched successfully",
      data: toApiState(existing),
    });
  }

  // No state yet -> recompute and persist.
  const computed = await recomputeStationState({
    stationId: id,
    io,
    emitStationStateUpdated,
  });

  if (!computed) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
  }

  return res.status(StatusCodes.OK).json({
    success: true,
    message: "Station state computed successfully",
    data: computed,
  });
});

const getAggregatedStations = asyncHandler(async (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;

  const stations = await prisma.station.findMany({ take: limit, orderBy: { createdAt: "desc" } });

  const states = await Promise.all(
    stations.map(async (s) => {
      const latest = await prisma.stationState.findFirst({
        where: { stationId: s.id },
        orderBy: { lastUpdated: "desc" },
      });
      return latest
        ? {
            ...toApiState(latest),
            stationName: s.name,
          }
        : {
            stationId: s.id,
            stationName: s.name,
            activeBookings: 0,
            occupancyPercentage: 0,
            bookingUtilization: 0,
            availableWindows: [],
            estimatedWaitTimeSeconds: null,
            chargerStatus: "UNKNOWN",
            providerOnline: false,
            currentActiveSessions: 0,
            lastUpdated: new Date().toISOString(),
          };
    })
  );

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Aggregated station states fetched successfully",
    data: states,
  });
});

const getLiveMetrics = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const now = new Date();

  const [station, latestTelemetry, activeBookings] = await Promise.all([
    prisma.station.findUnique({ where: { id } }),
    prisma.providerTelemetry.findFirst({
      where: { stationId: id },
      orderBy: { providerTimestamp: "desc" },
    }),
    prisma.booking.count({
      where: {
        stationId: id,
        status: "BOOKED",
        startTime: { lte: now },
        endTime: { gt: now },
      },
    }),
  ]);

  if (!station) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
  }

  const occupancyPercentage =
    station.totalSlots > 0 ? (activeBookings / station.totalSlots) * 100 : 0;

  const providerTimestamp = latestTelemetry?.providerTimestamp ?? latestTelemetry?.createdAt ?? null;
  const providerOnline = providerTimestamp
    ? now.getTime() - providerTimestamp.getTime() <= env.PROVIDER_STALE_MS
    : false;

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Live station metrics fetched successfully",
    data: {
      stationId: station.id,
      stationName: station.name,
      activeBookings,
      occupancyPercentage,
      providerOnline,
      latestTelemetry,
      lastUpdated: now.toISOString(),
    },
  });
});

module.exports = {
  getStationState,
  getAggregatedStations,
  getLiveMetrics,
};

