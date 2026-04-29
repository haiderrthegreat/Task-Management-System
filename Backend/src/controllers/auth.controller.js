const authService = require("../services/auth.service");
const { sendSuccess } = require("../utils/response");

/**
 * POST /api/auth/signup
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.validatedData;
    const result = await authService.signup({ name, email, password });
    return sendSuccess(res, 201, "User Created Successfully", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedData;
    const result = await authService.login({ email, password });
    return sendSuccess(res, 200, "Login successful", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.validatedData;
    const result = await authService.refreshAccessToken(refreshToken);
    return sendSuccess(res, 200, "Access token refreshed", result);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.validatedData;
    await authService.logout(refreshToken);
    return sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, refresh, logout };