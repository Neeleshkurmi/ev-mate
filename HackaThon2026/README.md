# EV Charging Backend (PostgreSQL + Prisma)

Scalable Node.js backend for EV charging station discovery and slot booking with JWT auth, Socket.IO updates, PostgreSQL transactions, and Google Maps-powered nearby search routing metadata.

## Tech Stack

- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT authentication
- Socket.IO real-time events
- Joi validation + centralized error handling
- Helmet, HPP, CORS, compression, rate limiting, request logging

## Updated Folder Structure

```
.
|-- config
|   |-- db.js
|   |-- env.js
|   `-- prisma.js
|-- controllers
|-- middleware
|-- prisma
|   |-- migrations
|   `-- schema.prisma
|-- routes
|-- seeds
|-- sockets
|-- src
|   `-- app.js
|-- utils
|-- validations
|-- server.js
`-- API_DOCUMENTATION.md
```

## Environment Variables

Set these in `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `GOOGLE_MAPS_API_KEY`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`

## Setup

1. Install dependencies:
   - `npm install`
2. Generate Prisma client:
   - `npm run prisma:generate`
3. Run migrations:
   - `npm run prisma:migrate`
4. Seed stations:
   - `npm run seed:stations`
5. Start API:
   - `npm run dev`

## Core APIs

- `GET /health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/stations`
- `GET /api/stations/nearby?lat=xx&lng=yy`
- `GET /api/stations/:id`
- `GET /api/stations/:id/route?originLat=xx&originLng=yy`
- `POST /api/bookings`
- `DELETE /api/bookings/:id`
- `GET /api/bookings/user`

## Real-time Events

- `station-availability-updated`
- `slot-booked`
- `slot-cancelled`
