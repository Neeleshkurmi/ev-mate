const { StatusCodes } = require("http-status-codes");
const axios = require("axios");

const prisma = require("../config/prisma");
const env = require("../config/env");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const bookingRepository = require("../repositories/bookingRepository");
const {
  getPaginationOptions,
  buildPaginationMeta,
} = require("../utils/pagination");
const { buildTextSearchFilter } = require("../utils/search");

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const getDistanceKm = (lat1, lng1, lat2, lng2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
};

const buildOccupancyMap = async () => {
  const now = new Date();
  const rows = await bookingRepository.groupLiveBookingsByStation(prisma, now);
  const map = {};
  for (const row of rows) {
    map[row.stationId] = row._count._all;
  }
  return map;
};

const normalizeStation = (station, occupancyMap = {}) => {
  const live = occupancyMap[station.id] ?? 0;
  const totalSlots = Number(station.totalSlots);
  return {
    ...station,
    latitude: Number(station.latitude),
    longitude: Number(station.longitude),
    pricePerKwh: Number(station.pricePerKwh),
    liveBookedConnectors: live,
    freeConnectorsNow: Math.max(0, totalSlots - live),
  };
};

const validateCoordinates = (latitude, longitude) => {
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Latitude and longitude must be valid numbers"
    );
  }

  if (latitude < -90 || latitude > 90) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Latitude must be between -90 and 90"
    );
  }

  if (longitude < -180 || longitude > 180) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Longitude must be between -180 and 180"
    );
  }
};

const applyStationFilters = (stations, query = {}, occupancyMap = {}) =>
  stations.filter((station) => {
    const textMatcher = buildTextSearchFilter(query.q, ["name", "address", "chargerType"]);
    const hasSearch = Boolean(textMatcher.$or?.length);
    const searchTerm = hasSearch ? query.q.trim().toLowerCase() : "";
    const minFree =
      query.minFreeConnectors !== undefined
        ? Number(query.minFreeConnectors)
        : query.minAvailableSlots !== undefined
          ? Number(query.minAvailableSlots)
          : undefined;
    const minPrice = query.minPrice !== undefined ? Number(query.minPrice) : undefined;
    const maxPrice = query.maxPrice !== undefined ? Number(query.maxPrice) : undefined;

    const totalSlots = Number(station.totalSlots);
    const live = occupancyMap[station.id] ?? 0;
    const freeConnectorsNow = Math.max(0, totalSlots - live);
    const pricePerKwh = Number(station.pricePerKwh);
    const chargerTypeMatch = query.chargerType
      ? station.chargerType.toLowerCase() === String(query.chargerType).toLowerCase()
      : true;
    const availabilityMatch =
      query.availability === undefined
        ? true
        : String(query.availability).toLowerCase() === "true"
          ? freeConnectorsNow > 0
          : freeConnectorsNow === 0;
    const minFreeMatch = minFree === undefined ? true : freeConnectorsNow >= minFree;
    const minPriceMatch = minPrice === undefined ? true : pricePerKwh >= minPrice;
    const maxPriceMatch = maxPrice === undefined ? true : pricePerKwh <= maxPrice;
    const searchMatch = hasSearch
      ? [station.name, station.address, station.chargerType].some((value) =>
          value.toLowerCase().includes(searchTerm)
        )
      : true;
    return (
      chargerTypeMatch &&
      availabilityMatch &&
      minFreeMatch &&
      minPriceMatch &&
      maxPriceMatch &&
      searchMatch
    );
  });

const mapRouteInfo = async (originLat, originLng, station) => {
  const routeUrl = `https://www.google.com/maps/dir/?api=1&origin=${originLat},${originLng}&destination=${station.latitude},${station.longitude}&travelmode=driving`;
  const response = {
    routeUrl,
  };

  if (!env.GOOGLE_MAPS_API_KEY) {
    return response;
  }

  try {
    const distanceResp = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins: `${originLat},${originLng}`,
          destinations: `${station.latitude},${station.longitude}`,
          key: env.GOOGLE_MAPS_API_KEY,
        },
      }
    );
    const element = distanceResp?.data?.rows?.[0]?.elements?.[0];
    if (element?.status === "OK") {
      response.distanceText = element.distance?.text;
      response.distanceMeters = element.distance?.value;
      response.durationText = element.duration?.text;
      response.durationSeconds = element.duration?.value;
    }
  } catch (_error) {
    // Route URL still works even if distance matrix is unavailable.
  }

  return response;
};

const getStations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const allStations = await prisma.station.findMany({
    orderBy: { createdAt: "desc" },
  });
  const occupancyMap = await buildOccupancyMap();
  const filtered = applyStationFilters(allStations, req.query, occupancyMap);
  const stations = filtered
    .slice(skip, skip + limit)
    .map((s) => normalizeStation(s, occupancyMap));

  const total = filtered.length;

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Stations fetched successfully",
    data: stations,
    meta: buildPaginationMeta(total, page, limit),
  });
});

const getStationById = asyncHandler(async (req, res) => {
  const station = await prisma.station.findUnique({
    where: { id: req.params.id },
  });

  if (!station) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
  }

  const occupancyMap = await buildOccupancyMap();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Station fetched successfully",
    data: normalizeStation(station, occupancyMap),
  });
});

const createStation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  validateCoordinates(Number(latitude), Number(longitude));

  const station = await prisma.station.create({ data: req.body });
  const occupancyMap = await buildOccupancyMap();

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Station created successfully",
    data: normalizeStation(station, occupancyMap),
  });
});

const updateStation = asyncHandler(async (req, res) => {
  if (req.body.latitude !== undefined || req.body.longitude !== undefined) {
    const stationForCoords = await prisma.station.findUnique({
      where: { id: req.params.id },
    });
    if (!stationForCoords) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
    }

    const latitude =
      req.body.latitude !== undefined
        ? Number(req.body.latitude)
        : stationForCoords.latitude;
    const longitude =
      req.body.longitude !== undefined
        ? Number(req.body.longitude)
        : stationForCoords.longitude;

    validateCoordinates(latitude, longitude);
  }

  const station = await prisma.station.update({
    where: { id: req.params.id },
    data: req.body,
  });

  const occupancyMap = await buildOccupancyMap();

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Charging station updated successfully",
    data: normalizeStation(station, occupancyMap),
  });
});

const deleteStation = asyncHandler(async (req, res) => {
  const station = await prisma.station.findUnique({ where: { id: req.params.id } });
  if (!station) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
  }
  await prisma.station.delete({ where: { id: req.params.id } });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Charging station deleted successfully",
  });
});

const getNearbyStations = asyncHandler(async (req, res) => {
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lng);
  const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : 5;

  validateCoordinates(latitude, longitude);

  if (Number.isNaN(radiusKm) || radiusKm <= 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "radiusKm must be a positive number"
    );
  }

  const { page, limit, skip } = getPaginationOptions(req.query);
  const allStations = await prisma.station.findMany();
  const occupancyMap = await buildOccupancyMap();
  const inRadius = allStations
    .map((station) => {
      const distanceKm = getDistanceKm(
        latitude,
        longitude,
        Number(station.latitude),
        Number(station.longitude)
      );
      return { ...station, distanceKm };
    })
    .filter((station) => station.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const filtered = applyStationFilters(inRadius, req.query, occupancyMap);
  const paginated = filtered.slice(skip, skip + limit);
  const stations = await Promise.all(
    paginated.map(async (station) => ({
      ...normalizeStation(station, occupancyMap),
      route: await mapRouteInfo(latitude, longitude, station),
    }))
  );
  const total = filtered.length;

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Nearby stations fetched successfully",
    data: stations,
    meta: buildPaginationMeta(total, page, limit),
  });
});

const searchStations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const allStations = await prisma.station.findMany({
    orderBy: { createdAt: "desc" },
  });
  const occupancyMap = await buildOccupancyMap();
  const filtered = applyStationFilters(allStations, req.query, occupancyMap);
  const stations = filtered
    .slice(skip, skip + limit)
    .map((s) => normalizeStation(s, occupancyMap));
  const total = filtered.length;

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Stations fetched successfully",
    data: stations,
    meta: buildPaginationMeta(total, page, limit),
  });
});

const getStationRoute = asyncHandler(async (req, res) => {
  const station = await prisma.station.findUnique({
    where: { id: req.params.id },
  });
  if (!station) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found");
  }
  const originLat = Number(req.query.originLat);
  const originLng = Number(req.query.originLng);
  validateCoordinates(originLat, originLng);
  const route = await mapRouteInfo(originLat, originLng, station);
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Route metadata generated successfully",
    data: {
      stationId: station.id,
      route,
    },
  });
});

const streamStationData = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const { stationId, temperature, humidity, smokeLevel } = req.body;

  const savedData = await prisma.stationData.create({
    data: {
      stationId,
      temperature,
      humidity,
      smokeLevel,
    },
  });

  if (io) {
    io.emit("station-data", savedData);

    if (smokeLevel > 80) {
      io.emit("danger-alert", {
        stationId,
        message: "High smoke detected",
      });
    }
  }

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Station data streamed successfully",
    data: savedData,
  });
});

const getStationData = asyncHandler(async (req, res) => {
  const { stationId, limit = 20 } = req.query;
  const readings = await prisma.stationData.findMany({
    where: stationId ? { stationId } : undefined,
    orderBy: { createdAt: "desc" },
    take: Number(limit),
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Station data fetched successfully",
    data: readings,
  });
});

module.exports = {
  streamStationData,
  getStationData,
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  getNearbyStations,
  searchStations,
  getStationRoute,
};
