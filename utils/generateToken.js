const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (userId) =>
  jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

module.exports = generateToken;
