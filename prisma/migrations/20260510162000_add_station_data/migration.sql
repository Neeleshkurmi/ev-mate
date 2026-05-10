-- CreateTable
CREATE TABLE "StationData" (
    "id" TEXT NOT NULL,
    "stationId" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "smokeLevel" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StationData_pkey" PRIMARY KEY ("id")
);
