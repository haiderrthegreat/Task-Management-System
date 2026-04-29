"use strict";

const { verifyAccessToken } = require("../utils/jwt");
const { sendError } = require("../utils/response");

/**
 * Verifies JWT access token from Authorization: Bearer <token>
 * Attaches decoded payload to req.user on success.
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, 401, "Access token missing or malformed");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return sendError(res, 401, "Access token missing");
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Access token expired");
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid access token");
    }
    next(error);
  }
};

module.exports = { authenticate };