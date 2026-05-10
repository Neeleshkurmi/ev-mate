const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/ApiError");

const validateRequest = (schema, source = "body") => (req, _res, next) => {
  const { error, value } = schema.validate(req[source], {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message).join(", ");
    return next(new ApiError(StatusCodes.BAD_REQUEST, message));
  }

  req[source] = value;
  next();
};

module.exports = validateRequest;
