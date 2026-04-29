const { prisma } = require("../config/db");
const { hashPassword, comparePassword } = require("../utils/hash");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getRefreshTokenExpiry,
} = require("../utils/jwt");

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Strip password from user object before sending to client
 */
const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

/**
 * Generate both tokens and persist the refresh token in the DB
 */
const issueTokens = async (user) => {
  const payload = { sub: user.id, email: user.email };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiryDate: getRefreshTokenExpiry(),
    },
  });

  return { accessToken, refreshToken };
};

// ─── Signup ───────────────────────────────────────────────────────────────────

const signup = async ({ name, email, password }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err = new Error("Email is already registered");
    err.statusCode = 409;
    throw err;
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  // const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: sanitizeUser(user),
    // accessToken,
    // refreshToken,
  };
};

// ─── Login ────────────────────────────────────────────────────────────────────

const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  // Dummy compare to prevent timing attacks / user enumeration
  if (!user) {
    await comparePassword(password, "$2b$12$invalidhashinvalidhashinvalidh");
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

const refreshAccessToken = async (token) => {
  // 1. Verify JWT signature
  try {
    verifyRefreshToken(token);
  } catch {
    const err = new Error("Invalid or expired refresh token");
    err.statusCode = 401;
    throw err;
  }

  // 2. Check token exists in DB
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!storedToken) {
    const err = new Error("Refresh token not found. Please log in again.");
    err.statusCode = 401;
    throw err;
  }

  // 3. Check DB-level expiry
  if (new Date() > storedToken.expiryDate) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    const err = new Error("Refresh token expired. Please log in again.");
    err.statusCode = 401;
    throw err;
  }

  const newAccessToken = generateAccessToken({
    sub: storedToken.user.id,
    email: storedToken.user.email,
  });

  return { accessToken: newAccessToken };
};

// ─── Logout ───────────────────────────────────────────────────────────────────

const logout = async (token) => {
  const stored = await prisma.refreshToken.findUnique({ where: { token } });

  if (!stored) {
    const err = new Error("Refresh token not found or already invalidated");
    err.statusCode = 400;
    throw err;
  }

  await prisma.refreshToken.delete({ where: { token } });
};

module.exports = {
  signup,
  login,
  refreshAccessToken,
  logout,
};