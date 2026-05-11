-- Station aggregation + provider ingestion models

CREATE TYPE "ChargerStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE', 'UNKNOWN');

CREATE TABLE "Provider" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "apiKey" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Provider_apiKey_key" ON "Provider"("apiKey");
CREATE INDEX "Provider_createdAt_idx" ON "Provider"("createdAt" DESC);

CREATE TABLE "ProviderTelemetry" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "chargerStatus" "ChargerStatus" NOT NULL,
  "powerUsage" DOUBLE PRECISION,
  "temperature" DOUBLE PRECISION,
  "activeSessions" INTEGER,
  "providerTimestamp" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProviderTelemetry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProviderTelemetry_stationId_providerTimestamp_idx" ON "ProviderTelemetry"("stationId", "providerTimestamp" DESC);

ALTER TABLE "ProviderTelemetry" ADD CONSTRAINT "ProviderTelemetry_providerId_fkey"
  FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProviderTelemetry" ADD CONSTRAINT "ProviderTelemetry_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "StationState" (
  "id" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "activeBookings" INTEGER NOT NULL,
  "occupancyPercentage" DOUBLE PRECISION NOT NULL,
  "availableWindows" JSONB NOT NULL,
  "estimatedWaitTimeSeconds" INTEGER,
  "chargerStatus" "ChargerStatus" NOT NULL,
  "providerOnline" BOOLEAN NOT NULL,
  "currentActiveSessions" INTEGER NOT NULL,
  "liveBookedConnectors" INTEGER NOT NULL,
  "lastProviderTimestamp" TIMESTAMP(3),
  "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "StationState_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StationState_stationId_lastUpdated_idx" ON "StationState"("stationId", "lastUpdated" DESC);

ALTER TABLE "StationState" ADD CONSTRAINT "StationState_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "AggregationSnapshot" (
  "id" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload" JSONB NOT NULL,

  CONSTRAINT "AggregationSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AggregationSnapshot_stationId_createdAt_idx" ON "AggregationSnapshot"("stationId", "createdAt" DESC);

ALTER TABLE "AggregationSnapshot" ADD CONSTRAINT "AggregationSnapshot_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ChargingSession" (
  "id" TEXT NOT NULL,
  "stationId" TEXT NOT NULL,
  "bookingId" TEXT,
  "providerTelemetryId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ChargingSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChargingSession_stationId_createdAt_idx" ON "ChargingSession"("stationId", "createdAt" DESC);

ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_stationId_fkey"
  FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE CASCADE ON UPDATE CASCADE;

