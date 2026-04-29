"use strict";

const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Generate a signed access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
    issuer: "express-auth-app",
  });
};

/**
 * Generate a signed refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
    issuer: "express-auth-app",
  });
};

/**
 * Verify an access token
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, env.jwt.accessSecret);
};

/**
 * Verify a refresh token
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.jwt.refreshSecret);
};

/**
 * Calculate refresh token expiry date (7 days from now)
 */
const getRefreshTokenExpiry = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  return expiry;
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
};