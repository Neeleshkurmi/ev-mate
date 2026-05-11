-- Time-based booking: replace slotTime + slot count with intervals and BookingStatus v2

DROP INDEX IF EXISTS "Booking_station_slot_active_unique";
DROP INDEX IF EXISTS "Booking_stationId_slotTime_idx";

CREATE TYPE "BookingStatus_new" AS ENUM ('BOOKED', 'COMPLETED', 'CANCELLED', 'EXPIRED');

ALTER TABLE "Booking" ADD COLUMN "startTime" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "endTime" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "status" "BookingStatus_new";

UPDATE "Booking" SET
  "startTime" = "slotTime",
  "endTime" = "slotTime" + interval '1 hour',
  "status" = CASE "bookingStatus"::text
    WHEN 'booked' THEN 'BOOKED'::"BookingStatus_new"
    WHEN 'cancelled' THEN 'CANCELLED'::"BookingStatus_new"
    WHEN 'completed' THEN 'COMPLETED'::"BookingStatus_new"
    ELSE 'BOOKED'::"BookingStatus_new"
  END;

ALTER TABLE "Booking" ALTER COLUMN "startTime" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "endTime" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Booking" ALTER COLUMN "status" SET DEFAULT 'BOOKED'::"BookingStatus_new";

ALTER TABLE "Booking" DROP COLUMN "slotTime";
ALTER TABLE "Booking" DROP COLUMN "bookingStatus";

DROP TYPE "BookingStatus";
ALTER TYPE "BookingStatus_new" RENAME TO "BookingStatus";

ALTER TABLE "Station" DROP COLUMN "availableSlots";

CREATE INDEX "Booking_stationId_status_startTime_idx" ON "Booking"("stationId", "status", "startTime");
CREATE INDEX "Booking_stationId_startTime_endTime_idx" ON "Booking"("stationId", "startTime", "endTime");
