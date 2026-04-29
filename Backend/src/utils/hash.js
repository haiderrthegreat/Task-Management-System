"use strict";

const bcrypt = require("bcrypt");
const env = require("../config/env");

/**
 * Hash a plain-text password
 */
const hashPassword = async (password) => {
  return bcrypt.hash(password, env.bcrypt.saltRounds);
};

/**
 * Compare a plain-text password against a stored hash
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

module.exports = { hashPassword, comparePassword };