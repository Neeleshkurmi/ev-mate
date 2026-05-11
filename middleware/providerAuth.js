const { StatusCodes } = require("http-status-codes");

const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");

// Auth: provider sends API key in header `x-provider-api-key`.
const providerAuth = async (req, _res, next) => {
  const apiKey = req.headers["x-provider-api-key"];
  if (!apiKey) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Missing provider API key"));
  }

  const provider = await prisma.provider.findUnique({ where: { apiKey } });
  if (!provider) {
    return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid provider API key"));
  }

  req.provider = provider;
  return next();
};

module.exports = { providerAuth };

