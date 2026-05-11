-- Ensure StationState is one-row-per-station for safe upsert().

CREATE UNIQUE INDEX IF NOT EXISTS "StationState_stationId_key" ON "StationState"("stationId");

