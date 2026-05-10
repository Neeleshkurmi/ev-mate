const Joi = require("joi");

const createBookingSchema = Joi.object({
  stationId: Joi.string().uuid().required(),
  slotTime: Joi.date().iso().required(),
});

const bookingIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

module.exports = {
  createBookingSchema,
  bookingIdParamSchema,
};
