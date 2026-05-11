const { EventEmitter } = require("events");

// Single in-process event bus for booking/provider -> recompute flows.
// In production behind multiple instances, replace with Redis pub/sub or a queue.
const eventBus = new EventEmitter();

module.exports = eventBus;

