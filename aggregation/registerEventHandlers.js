const eventBus = require("./eventBus");
const { recomputeStationState } = require("./stationStateEngine/stationStateEngine");
const { emitStationStateUpdated } = require("../sockets/handlers/stationSocketHandler");

const debounceTimers = new Map(); // stationId -> timeoutId

const scheduleRecompute = ({ stationId, io, force = false }) => {
  const key = String(stationId);
  if (debounceTimers.has(key)) clearTimeout(debounceTimers.get(key));

  const timeout = setTimeout(() => {
    recomputeStationState({
      stationId: key,
      io,
      emitStationStateUpdated,
      force,
    }).catch((err) => {
      console.error("[aggregation] recompute failed:", err.message);
    });
    debounceTimers.delete(key);
  }, 250);

  debounceTimers.set(key, timeout);
};

const startAggregationEventHandlers = ({ io }) => {
  eventBus.on("booking-created", ({ stationId }) => scheduleRecompute({ stationId, io }));
  eventBus.on("booking-cancelled", ({ stationId }) =>
    scheduleRecompute({ stationId, io })
  );
  eventBus.on("booking-expired", ({ stationId }) => scheduleRecompute({ stationId, io }));
  eventBus.on("provider-telemetry-received", ({ stationId }) =>
    scheduleRecompute({ stationId, io })
  );
  eventBus.on("provider-stale-detected", ({ stationId }) =>
    scheduleRecompute({ stationId, io, force: true })
  );
};

module.exports = {
  startAggregationEventHandlers,
};

