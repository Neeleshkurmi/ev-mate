# IoT Station Data Streaming Changes

This document summarizes the backend changes made to support real-time IoT data streaming for EV charging stations.

## Problem Fixed

Opening `http://localhost:5000/api/stations/data` in the browser was returning:

```json
{
  "success": false,
  "message": "Charging station not found"
}
```

This happened because `GET /api/stations/data` was being matched by the dynamic route `GET /api/stations/:id`, so Express treated `data` as a station ID.

## Main Changes

### 1. Local Database Support

Added [docker-compose.yml](./docker-compose.yml) to run PostgreSQL locally.

Service added:

```yaml
postgres:
  image: postgres:16-alpine
  ports:
    - "5432:5432"
```

This matches the local `DATABASE_URL`:

```text
postgresql://postgres:root@localhost:5432/ev_booking?schema=public
```

### 2. Environment File Restored

Restored `.env.example` and recreated local `.env` values for development.

Important variables:

```text
PORT=5000
DATABASE_URL=postgresql://postgres:root@localhost:5432/ev_booking?schema=public
JWT_SECRET=replace_with_a_strong_secret
GOOGLE_MAPS_API_KEY=replace_with_google_maps_api_key
```

### 3. Prisma Model Added

Added `StationData` model in [prisma/schema.prisma](./prisma/schema.prisma):

```prisma
model StationData {
  id           String   @id @default(uuid())
  stationId    String
  temperature  Float
  humidity     Float
  smokeLevel   Float
  createdAt    DateTime @default(now())
}
```

### 4. Prisma Migration Added

Added migration:

```text
prisma/migrations/20260510162000_add_station_data/migration.sql
```

It creates the `StationData` table.

### 5. IoT Data POST Endpoint Added

Added:

```text
POST /api/stations/data
```

Purpose:

- Accept IoT sensor data
- Save data in PostgreSQL
- Emit real-time Socket.IO event
- Emit danger alert when smoke level is high

Example request:

```json
{
  "stationId": "station-1",
  "temperature": 31,
  "humidity": 58,
  "smokeLevel": 12
}
```

Example response:

```json
{
  "success": true,
  "message": "Station data streamed successfully",
  "data": {
    "id": "82d90d98-231a-4ae0-9e03-42f0a17efaf6",
    "stationId": "station-1",
    "temperature": 31,
    "humidity": 58,
    "smokeLevel": 12,
    "createdAt": "2026-05-10T11:48:02.585Z"
  }
}
```

### 6. IoT Data GET Endpoint Added

Added:

```text
GET /api/stations/data
```

Purpose:

- Show latest saved IoT readings
- Make browser testing easier
- Prevent `data` from being treated as a station ID

Optional query parameters:

```text
stationId=station-1
limit=20
```

Example:

```text
GET /api/stations/data?stationId=station-1&limit=10
```

Example response:

```json
{
  "success": true,
  "message": "Station data fetched successfully",
  "data": [
    {
      "id": "82d90d98-231a-4ae0-9e03-42f0a17efaf6",
      "stationId": "station-1",
      "temperature": 31,
      "humidity": 58,
      "smokeLevel": 12,
      "createdAt": "2026-05-10T11:48:02.585Z"
    }
  ]
}
```

### 7. Validation Added

Added Joi validation for IoT request body:

```js
{
  stationId: required string,
  temperature: required number,
  humidity: required number between 0 and 100,
  smokeLevel: required number >= 0
}
```

Added Joi validation for IoT query parameters:

```js
{
  stationId: optional string,
  limit: optional number between 1 and 100
}
```

### 8. Socket.IO Streaming Added

When new station data is posted, the backend emits:

```text
station-data
```

If `smokeLevel > 80`, the backend also emits:

```text
danger-alert
```

Alert payload:

```json
{
  "stationId": "station-1",
  "message": "High smoke detected"
}
```

### 9. Express Trust Proxy Fix

Changed `trust proxy` in [src/app.js](./src/app.js):

```js
app.set("trust proxy", env.NODE_ENV === "production" ? 1 : false);
```

Reason:

- `express-rate-limit` showed an unsafe proxy warning
- `trust proxy = true` can allow rate limit bypasses
- Development now uses `false`, production uses one trusted proxy

## Changed Files

```text
.env
.env.example
docker-compose.yml
prisma/schema.prisma
prisma/migrations/20260510162000_add_station_data/migration.sql
controllers/stationController.js
routes/stationRoutes.js
validations/stationValidation.js
src/app.js
API_DOCUMENTATION.md
```

## How To Run

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Apply migrations:

```powershell
npx.cmd prisma migrate deploy
```

Start backend:

```powershell
npm.cmd start
```

## How To Test

Open in browser:

```text
http://localhost:5000/api/stations/data
```

Send IoT data:

```powershell
Invoke-WebRequest `
  -Uri "http://localhost:5000/api/stations/data" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"stationId":"station-1","temperature":31,"humidity":58,"smokeLevel":12}'
```

Check health:

```text
http://localhost:5000/health
```

## Verification Completed

The following checks were run successfully:

```text
npx.cmd prisma validate
npm.cmd run prisma:generate
node --check for all project JavaScript files
GET /health returned 200
GET /api/stations/data returned 200
POST /api/stations/data returned 201
```
