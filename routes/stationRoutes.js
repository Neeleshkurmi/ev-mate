const express = require("express");

const {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
  getNearbyStations,
  searchStations,
  getStationRoute,
  streamStationData,
  getStationData,
} = require("../controllers/stationController");
const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  createStationSchema,
  updateStationSchema,
  stationQuerySchema,
  nearbyStationQuerySchema,
  stationRouteQuerySchema,
  stationDataSchema,
  stationDataQuerySchema,
} = require("../validations/stationValidation");

const router = express.Router();

router.get("/", validateRequest(stationQuerySchema, "query"), getStations);
router.get("/search", validateRequest(stationQuerySchema, "query"), searchStations);
router.get(
  "/nearby",
  validateRequest(nearbyStationQuerySchema, "query"),
  getNearbyStations
);
router.get(
  "/:id/route",
  validateRequest(stationRouteQuerySchema, "query"),
  getStationRoute
);
router.get("/data", validateRequest(stationDataQuerySchema, "query"), getStationData);
router.post("/data", validateRequest(stationDataSchema), streamStationData);
router.get("/:id", getStationById);
router.post("/", authMiddleware, validateRequest(createStationSchema), createStation);
router.put(
  "/:id",
  authMiddleware,
  validateRequest(updateStationSchema),
  updateStation
);
router.delete("/:id", authMiddleware, deleteStation);

module.exports = router;
