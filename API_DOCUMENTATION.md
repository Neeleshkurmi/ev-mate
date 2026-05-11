# EV Charging Backend API Documentation

Base URL: `http://localhost:5000`  
API Prefix: `/api`

Dates and times for booking and availability endpoints use **ISO-8601 UTC** (`Z`). Calendar query parameters such as `date=YYYY-MM-DD` are interpreted as **UTC midnight bounds** for that calendar day.

## Response format

### Success

```json
{
  "success": true,
  "message": "Booking successful",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Requested time slot is already booked",
  "path": "/api/...",
  "timestamp": "2026-05-03T00:00:00.000Z"
}
```

## Auth APIs

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile` (Bearer token required)

## Station APIs

### List and search

- `GET /api/stations` — filters: `q`, `chargerType`, `availability`, `minFreeConnectors` (alias: `minAvailableSlots`), `minPrice`, `maxPrice`, `page`, `limit`
  - **availability** (boolean): when `true`, stations with at least one free connector **right now** (`freeConnectorsNow > 0`). Derived from active `BOOKED` intervals, not a stored counter.
  - **freeConnectorsNow** / **liveBookedConnectors** are included on each station payload.
- `GET /api/stations/search` — same filters as above.
- `GET /api/stations/nearby?lat=xx&lng=yy&radiusKm=5` — Haversine radius, same filters, plus `route` metadata (`routeUrl` and optional Google Distance Matrix fields when `GOOGLE_MAPS_API_KEY` is set).

### Detail and navigation (maps-compatible)

- `GET /api/stations/:id` — station profile with live connector counts.
- `GET /api/stations/:id/route?originLat=xx&originLng=yy` — turn-by-turn deep link and optional distance/duration for map clients.

### Time-based availability

- `GET /api/stations/:id/availability?date=YYYY-MM-DD`  
  Returns `bookedIntervals` (active `BOOKED` only) and `freeSegments` for that UTC day: wall-clock segments where `freeConnectors > 0`, with `usedSlots` / `freeConnectors` per segment (supports `totalSlots` concurrent reservations).

- `GET /api/stations/:id/free-slots?date=YYYY-MM-DD&durationMinutes=60&stepMinutes=15`  
  Returns a stepped list of bookable `{ startTime, endTime }` windows that respect `totalSlots` concurrency, plus `suggestedNextSlot` from the first long enough gap after “now”.

### Aggregated real-time state (Uber-style)

- `GET /api/stations/:id/state`  
  Returns the latest computed station state (active bookings, occupancy, available windows, estimated wait time, live charger/provider status).

- `GET /api/stations/aggregated`  
  Returns a list of latest computed station states for all stations (best-effort).

- `GET /api/stations/:id/live-metrics`  
  Returns live metrics combining latest provider telemetry + current occupancy.

### IoT / telemetry

- `GET /api/stations/data` — optional `stationId`, `limit`.
- `POST /api/stations/data` — body: `stationId`, `temperature`, `humidity`, `smokeLevel`; emits Socket.IO `station-data`.

### Provider ingestion (external IoT providers)

- `POST /api/providers/telemetry`  
  Body: provider telemetry payload (will be normalized). Provider authenticates via `x-provider-api-key`.

- `POST /api/providers/webhook`  
  Same ingestion behaviour as telemetry, for providers that push via webhooks.

### Admin (Bearer token)

- `POST /api/stations`
- `PUT /api/stations/:id`
- `DELETE /api/stations/:id`

Stations expose **`totalSlots`** as the maximum number of **overlapping** `BOOKED` reservations allowed (parallel connectors). There is **no** stored `availableSlots` counter.

## Booking APIs

### Create (Bearer token)

`POST /api/bookings`

Body:

```json
{
  "stationId": "uuid",
  "startTime": "2026-05-12T14:00:00.000Z",
  "endTime": "2026-05-12T15:30:00.000Z"
}
```

Rules:

- `endTime` must be after `startTime`; range must not start in the past.
- Duration bounds from env (defaults): minimum **15** minutes, maximum **8** hours (`BOOKING_MIN_DURATION_MS`, `BOOKING_MAX_DURATION_MS`).
- Overlap is evaluated only against **`BOOKED`** rows. **`CANCELLED`**, **`COMPLETED`**, and **`EXPIRED`** do not block.
- Interval overlap (same as SQL filter): `existing.start < requested.end AND existing.end > requested.start`.
- Concurrency: reservations are limited by `station.totalSlots` using a peak-concurrency check inside a **`Serializable`** Prisma transaction with **`SELECT … FOR UPDATE`** on the station row.
- On serialization failure, API may respond with **409** and a retry message (`P2034` mapped in the global error handler).

### Cancel (Bearer token)

`DELETE /api/bookings/:id` — sets status to `CANCELLED` for the owner’s active `BOOKED` booking.

### List for current user (Bearer token)

`GET /api/bookings/user` — includes related `station`.

## Booking lifecycle (`status`)

| Status      | Meaning |
|------------|---------|
| `BOOKED`   | Active reservation |
| `COMPLETED`| Terminal (manual completion flows may set this later) |
| `CANCELLED`| User cancelled |
| `EXPIRED`  | `endTime` passed while still `BOOKED`; set by the background scheduler |

Automatic expiry: a background job runs every **`BOOKING_EXPIRY_INTERVAL_MS`** (default **60000** ms). It transitions `BOOKED` → `EXPIRED` when `endTime < now`.

## Real-time (Socket.IO)

Client can join `station-{stationId}` via existing `join-station-room` / `leave-station-room` events.

Backend emits ONLY computed aggregated station state events:

| Event | Payload | Trigger |
|------|---------|---------|
| `station-state-updated` | `{ stationId, stationName, activeBookings, occupancyPercentage, availableWindows, estimatedWaitTimeSeconds, chargerStatus, providerOnline, currentActiveSessions, lastUpdated, ... }` | Booking created/cancelled/expired and provider telemetry ingestion cause station aggregation recompute |

## Environment variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string (required) |
| `JWT_SECRET` | Auth signing (required) |
| `GOOGLE_MAPS_API_KEY` | Distance Matrix + map URLs (required by current `config/env.js`) |
| `CLIENT_URL` | Socket.IO CORS origin |
| `BOOKING_MIN_DURATION_MS` | Minimum booking length (default 15 min) |
| `BOOKING_MAX_DURATION_MS` | Maximum booking length (default 8 h) |
| `BOOKING_EXPIRY_INTERVAL_MS` | Expiry job interval (default 60 s) |

## Production notes

- Run migrations: `npm run prisma:deploy` (or `prisma migrate dev` in development).
- After schema changes: `npm run prisma:generate`.
- Integration stress tests for double-booking can be enabled with `RUN_BOOKING_INTEGRATION=1` (see `tests/concurrentBooking.test.js`).

## Postman

Import `postman/EV-Mate.postman_collection.json` for example requests including time-based booking and availability calls.
