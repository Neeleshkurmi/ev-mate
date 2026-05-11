const Joi = require("joi");

const providerTelemetryPayloadSchema = Joi.object({
  stationId: Joi.string().trim().optional(),
  station_id: Joi.string().trim().optional(),
  chargerId: Joi.string().trim().optional(),
  charger_id: Joi.string().trim().optional(),
  deviceId: Joi.string().trim().optional(),
  device_id: Joi.string().trim().optional(),

  chargerStatus: Joi.string().trim().optional(),
  charger_status: Joi.string().trim().optional(),
  status: Joi.string().trim().optional(),
  charger_state: Joi.string().trim().optional(),

  powerUsage: Joi.number().optional(),
  power_usage: Joi.number().optional(),
  power_kw: Joi.number().optional(),
  kwh: Joi.number().optional(),

  temperature: Joi.number().optional(),
  temp_c: Joi.number().optional(),
  temperatureC: Joi.number().optional(),

  activeSessions: Joi.number().integer().min(0).optional(),
  active_sessions: Joi.number().integer().min(0).optional(),
  sessions: Joi.number().integer().min(0).optional(),
  active_session_count: Joi.number().integer().min(0).optional(),

  providerTimestamp: Joi.date().iso().optional(),
  provider_timestamp: Joi.date().iso().optional(),
  provider_time: Joi.date().iso().optional(),
  timestamp: Joi.date().iso().optional(),
  ts: Joi.date().iso().optional(),
}).or("stationId", "station_id", "chargerId", "charger_id", "deviceId", "device_id");

const providerPayloadWrapperSchema = Joi.object({
  // Allow providers to send either a raw telemetry object, or { telemetry: {...} }.
  telemetry: providerTelemetryPayloadSchema.optional(),
  data: providerTelemetryPayloadSchema.optional(),
}).unknown(true);

module.exports = {
  providerTelemetryPayloadSchema,
  providerPayloadWrapperSchema,
};

