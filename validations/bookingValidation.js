const Joi = require("joi");

const createBookingSchema = Joi.object({
  stationId: Joi.string().uuid().required(),
  startTime: Joi.date().iso().required(),
  endTime: Joi.date().iso().required(),
});

const bookingIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createBookingSchema,
  bookingIdParamSchema,
};
