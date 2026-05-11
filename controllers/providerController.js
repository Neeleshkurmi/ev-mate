const { StatusCodes } = require("http-status-codes");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const prisma = require("../config/prisma");
const eventBus = require("../aggregation/eventBus");

const { normalizeProviderTelemetry } = require("../provider/normalization/normalizeProviderTelemetry");

const extractPayloadObject = (body) => {
  if (!body || typeof body !== "object") return {};
  if (body.telemetry) return body.telemetry;
  if (body.data) return body.data;
  return body;
};

const ingestTelemetry = asyncHandler(async (req, res) => {
  const provider = req.provider;
  if (!provider) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Provider authentication required");
  }

  const rawPayload = extractPayloadObject(req.body);
  const normalized = normalizeProviderTelemetry(rawPayload);

  if (!normalized.stationId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "stationId is required for telemetry ingestion");
  }

  // Ensure station exists.
  const station = await prisma.station.findUnique({ where: { id: normalized.stationId } });
  if (!station) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Charging station not found for provided stationId");
  }

  await prisma.providerTelemetry.create({
    data: {
      providerId: provider.id,
      stationId: normalized.stationId,
      chargerStatus: normalized.chargerStatus,
      powerUsage: normalized.powerUsage,
      temperature: normalized.temperature,
      activeSessions: normalized.activeSessions,
      providerTimestamp: normalized.providerTimestamp,
    },
  });

  // Trigger aggregation recompute + socket broadcast via event-driven handler.
  eventBus.emit("provider-telemetry-received", {
    stationId: normalized.stationId,
  });

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Telemetry ingested successfully",
  });
});

module.exports = {
  ingestTelemetry,
};

