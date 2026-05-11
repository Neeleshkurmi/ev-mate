const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { providerAuth } = require("../middleware/providerAuth");

const { ingestTelemetry } = require("../controllers/providerController");
const { providerPayloadWrapperSchema } = require("../validations/providerValidation");

const router = express.Router();

router.post("/telemetry", providerAuth, validateRequest(providerPayloadWrapperSchema), ingestTelemetry);
router.post("/webhook", providerAuth, validateRequest(providerPayloadWrapperSchema), ingestTelemetry);

module.exports = router;

