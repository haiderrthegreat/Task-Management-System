"use strict";

const env = require("../config/env");
const { sendError } = require("../utils/response");

/**
 * 404 handler — for unmatched routes
 */
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Global error handler — catches all errors forwarded via next(err)
 */
// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, {
    message: err.message,
    stack: env.isDev ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error";

  // Prisma: unique constraint violation
  if (err.code === "P2002") {
    const field = err.meta?.target?.[0] || "field";
    return sendError(res, 409, `A record with this ${field} already exists`);
  }

  // Prisma: record not found
  if (err.code === "P2025") {
    return sendError(res, 404, "Record not found");
  }

  // JWT fallback
  if (err.name === "TokenExpiredError") {
    return sendError(res, 401, "Token expired");
  }
  if (err.name === "JsonWebTokenError") {
    return sendError(res, 401, "Invalid token");
  }

  const responseMessage =
    env.isDev ? message : statusCode >= 500 ? "Internal Server Error" : message;

  return sendError(
    res,
    statusCode,
    responseMessage,
    env.isDev ? { stack: err.stack } : null
  );
};

module.exports = { notFound, globalErrorHandler };