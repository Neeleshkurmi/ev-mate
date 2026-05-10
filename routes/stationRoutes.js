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
} = require("../controllers/stationController");
const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const {
  createStationSchema,
  updateStationSchema,
  stationQuerySchema,
  nearbyStationQuerySchema,
  stationRouteQuerySchema,
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
