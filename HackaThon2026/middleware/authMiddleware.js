const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const env = require("../config/env");
const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Authentication token missing");
  }

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid authentication token");
  }

  req.user = user;
  next();
});

module.exports = authMiddleware;
