const { ChargerStatus } = require("@prisma/client");

const normalizeChargerStatus = (raw) => {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s) return "UNKNOWN";

  if (Object.values(ChargerStatus).includes(s)) return s;

  // Common provider aliases
  if (["ON", "ONLINE", "ACTIVE", "CHARGING", "AVAILABLE"].includes(s)) return "AVAILABLE";
  if (["BUSY", "CHARGING_BUSY", "IN_USE"].includes(s)) return "BUSY";
  if (["OFF", "OFFLINE", "DISCONNECTED"].includes(s)) return "OFFLINE";

  return "UNKNOWN";
};

/**
 * Normalized internal schema:
 * {
 *   stationId,
 *   chargerStatus,
 *   powerUsage,
 *   temperature,
 *   activeSessions,
 *   providerTimestamp
 * }
 */
const normalizeProviderTelemetry = (payload) => {
  const stationId =
    payload?.stationId ??
    payload?.station_id ??
    payload?.chargerId ??
    payload?.charger_id ??
    payload?.deviceId ??
    payload?.device_id;

  const chargerStatusRaw =
    payload?.chargerStatus ??
    payload?.charger_status ??
    payload?.status ??
    payload?.charger_state;

  const providerTimestampRaw =
    payload?.providerTimestamp ??
    payload?.provider_timestamp ??
    payload?.provider_time ??
    payload?.timestamp ??
    payload?.ts;

  const providerTimestamp = providerTimestampRaw ? new Date(providerTimestampRaw) : null;
  if (providerTimestamp && Number.isNaN(providerTimestamp.getTime())) {
    throw new Error("Invalid providerTimestamp");
  }

  const powerUsageRaw = payload?.powerUsage ?? payload?.power_usage ?? payload?.kwh ?? payload?.power_kw;
  const temperatureRaw = payload?.temperature ?? payload?.temp_c ?? payload?.temperatureC;
  const activeSessionsRaw =
    payload?.activeSessions ?? payload?.active_sessions ?? payload?.sessions ?? payload?.active_session_count;

  const powerUsage =
    powerUsageRaw !== undefined && powerUsageRaw !== null ? Number(powerUsageRaw) : undefined;
  const temperature =
    temperatureRaw !== undefined && temperatureRaw !== null ? Number(temperatureRaw) : undefined;
  const activeSessions =
    activeSessionsRaw !== undefined && activeSessionsRaw !== null
      ? Number(activeSessionsRaw)
      : undefined;

  return {
    stationId: String(stationId ?? ""),
    chargerStatus: normalizeChargerStatus(chargerStatusRaw),
    powerUsage: Number.isFinite(powerUsage) ? powerUsage : undefined,
    temperature: Number.isFinite(temperature) ? temperature : undefined,
    activeSessions: Number.isFinite(activeSessions) ? activeSessions : undefined,
    providerTimestamp: providerTimestamp ?? new Date(),
  };
};

module.exports = {
  normalizeProviderTelemetry,
};

