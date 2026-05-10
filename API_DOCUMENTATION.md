# EV Charging Backend API Documentation

Base URL: `http://localhost:5000`  
API Prefix: `/api`

## Response Format

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
  "message": "Error message",
  "path": "/api/...",
  "timestamp": "2026-05-03T00:00:00.000Z"
}
```

## Auth APIs

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile` (Bearer token required)

## Station APIs

- `GET /api/stations` (supports `q`, `chargerType`, `availability`, `minAvailableSlots`, `minPrice`, `maxPrice`, `page`, `limit`)
- `GET /api/stations/search` (same filters as above)
- `GET /api/stations/nearby?lat=xx&lng=yy&radiusKm=5&availability=true&chargerType=CCS2&minPrice=10&maxPrice=18`
  - Includes geolocation filtering by Haversine distance.
  - Supports filters for charger type, slot availability, minimum available slots, price range, and text search.
  - Includes route metadata (`routeUrl`) and attempts Google Distance Matrix enrichments.
- `GET /api/stations/:id`
- `GET /api/stations/:id/route?originLat=xx&originLng=yy`
  - Returns route/navigation structure for client maps usage.
- `GET /api/stations/data`
  - Returns latest IoT station readings.
  - Optional query params: `stationId`, `limit`.
- `POST /api/stations/data`
  - Saves IoT station data and emits a real-time Socket.IO event.
  - Body: `stationId`, `temperature`, `humidity`, `smokeLevel`.
- `POST /api/stations` (Bearer token required)
- `PUT /api/stations/:id` (Bearer token required)
- `DELETE /api/stations/:id` (Bearer token required)

## Booking APIs

- `POST /api/bookings` (Bearer token required)
  - Uses PostgreSQL transaction with row-level lock to avoid double booking.
  - Decrements `availableSlots` atomically.
- `DELETE /api/bookings/:id` (Bearer token required)
  - Cancels booking and restores slot count atomically.
- `GET /api/bookings/user` (Bearer token required)

## Real-time Socket Events

- `station-availability-updated`
- `station-data`
- `danger-alert`
- `slot-booked`
- `slot-cancelled`

## Production Enhancements Enabled

- Joi request validation
- Centralized async + error handling
- Prisma-specific database error normalization
- Rate limiting
- Security middleware (`helmet`, `hpp`, `cors`)
- Compression + logging
- Pagination + search/filter support
