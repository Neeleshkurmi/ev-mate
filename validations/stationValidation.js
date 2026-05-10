const Joi = require("joi");

const stationPayload = {
  name: Joi.string().trim().min(2).max(120),
  address: Joi.string().trim().min(4).max(250),
  latitude: Joi.number().min(-90).max(90),
  longitude: Joi.number().min(-180).max(180),
  chargerType: Joi.string().trim().min(2).max(60),
  totalSlots: Joi.number().integer().min(1),
  availableSlots: Joi.number().integer().min(0),
  pricePerKwh: Joi.number().min(0),
};

const createStationSchema = Joi.object({
  ...stationPayload,
  name: stationPayload.name.required(),
  address: stationPayload.address.required(),
  latitude: stationPayload.latitude.required(),
  longitude: stationPayload.longitude.required(),
  chargerType: stationPayload.chargerType.required(),
  totalSlots: stationPayload.totalSlots.required(),
  availableSlots: stationPayload.availableSlots.required(),
  pricePerKwh: stationPayload.pricePerKwh.required(),
});

const updateStationSchema = Joi.object(stationPayload).min(1);

const stationQuerySchema = Joi.object({
  chargerType: Joi.string().trim(),
  availability: Joi.boolean(),
  minAvailableSlots: Joi.number().integer().min(0),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  q: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
}).custom((value, helpers) => {
  if (
    value.minPrice !== undefined &&
    value.maxPrice !== undefined &&
    value.minPrice > value.maxPrice
  ) {
    return helpers.error("any.invalid");
  }

  return value;
}, "price range validation").messages({
  "any.invalid": "minPrice cannot be greater than maxPrice",
});

const nearbyStationQuerySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radiusKm: Joi.number().positive().default(5),
  chargerType: Joi.string().trim(),
  availability: Joi.boolean(),
  minAvailableSlots: Joi.number().integer().min(0),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
  q: Joi.string().trim().max(100),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
}).custom((value, helpers) => {
  if (
    value.minPrice !== undefined &&
    value.maxPrice !== undefined &&
    value.minPrice > value.maxPrice
  ) {
    return helpers.error("any.invalid");
  }

  return value;
}, "price range validation").messages({
  "any.invalid": "minPrice cannot be greater than maxPrice",
});

const stationRouteQuerySchema = Joi.object({
  originLat: Joi.number().min(-90).max(90).required(),
  originLng: Joi.number().min(-180).max(180).required(),
});

const stationDataSchema = Joi.object({
  stationId: Joi.string().trim().required(),
  temperature: Joi.number().required(),
  humidity: Joi.number().min(0).max(100).required(),
  smokeLevel: Joi.number().min(0).required(),
});

const stationDataQuerySchema = Joi.object({
  stationId: Joi.string().trim(),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createStationSchema,
  updateStationSchema,
  stationQuerySchema,
  nearbyStationQuerySchema,
  stationRouteQuerySchema,
  stationDataSchema,
  stationDataQuerySchema,
};
