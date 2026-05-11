const fs = require("fs");

const path = "postman/EV-Mate.postman_collection.json";
const j = JSON.parse(fs.readFileSync(path, "utf8"));

const base = "{{baseUrl}}";

const stationsGroup = j.item.find((g) => g.name === "Stations");
if (stationsGroup) {
  const items = stationsGroup.item;
  const idx = items.findIndex((x) => x.name === "Station free slots");

  const newItems = [
    {
      name: "Station state",
      request: { method: "GET", url: `${base}/api/stations/{{stationId}}/state` },
    },
    {
      name: "Aggregated station states",
      request: { method: "GET", url: `${base}/api/stations/aggregated` },
    },
    {
      name: "Live metrics",
      request: { method: "GET", url: `${base}/api/stations/{{stationId}}/live-metrics` },
    },
  ];

  if (idx >= 0) items.splice(idx + 1, 0, ...newItems);
  else items.push(...newItems);
}

let providersGroup = j.item.find((g) => g.name === "Providers");
if (!providersGroup) {
  providersGroup = { name: "Providers", item: [] };
  j.item.push(providersGroup);
}

const rawTelemetry =
  '{"stationId":"{{stationId}}","chargerStatus":"BUSY","activeSessions":2,"powerUsage":24.5,"temperature":31,"providerTimestamp":"2026-05-12T14:00:00.000Z"}';
const rawWebhook =
  '{"telemetry":{"stationId":"{{stationId}}","status":"BUSY","active_sessions":2,"power_usage":24.5,"temperature":31,"timestamp":"2026-05-12T14:00:00.000Z"}}';

providersGroup.item = [
  {
    name: "Ingest telemetry",
    request: {
      method: "POST",
      header: [
        { key: "Content-Type", value: "application/json" },
        { key: "x-provider-api-key", value: "{{providerApiKey}}" },
      ],
      url: `${base}/api/providers/telemetry`,
      body: { mode: "raw", raw: rawTelemetry },
    },
  },
  {
    name: "Provider webhook",
    request: {
      method: "POST",
      header: [
        { key: "Content-Type", value: "application/json" },
        { key: "x-provider-api-key", value: "{{providerApiKey}}" },
      ],
      url: `${base}/api/providers/webhook`,
      body: { mode: "raw", raw: rawWebhook },
    },
  },
];

if (!j.variable.find((v) => v.key === "providerApiKey")) {
  j.variable.push({ key: "providerApiKey", value: "" });
}

fs.writeFileSync(path, JSON.stringify(j, null, 2));

