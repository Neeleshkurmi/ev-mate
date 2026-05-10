const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");

const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();
  const trimmedName = name?.trim();

  if (!trimmedName || !normalizedEmail || !password) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Name, email and password are required"
    );
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please provide a valid email");
  }

  if (password.length < 6) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Password must be at least 6 characters long"
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: trimmedName,
      email: normalizedEmail,
      password: hashedPassword,
    },
  });
  const token = generateToken(user.id);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: "Signup successful",
    data: {
      token,
      user: sanitizeUser(user),
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Email and password are required");
  }

  if (!isValidEmail(normalizedEmail)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Please provide a valid email");
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const token = generateToken(user.id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: sanitizeUser(user),
    },
  });
});

const getProfile = asyncHandler(async (req, res) => {
  res.status(StatusCodes.OK).json({
    success: true,
    message: "Profile fetched successfully",
    data: req.user,
  });
});

module.exports = {
  signup,
  login,
  getProfile,
};
