const { Router } = require("express");
const authController = require("../controllers/auth.controller");
const { validate } = require("../middlewares/validate.middleware");
const {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} = require("../validators/auth.validator");

const router = Router();

// POST /api/auth/signup
router.post("/signup", validate(signupSchema), authController.signup);

// POST /api/auth/login
router.post("/login", validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post("/refresh", validate(refreshTokenSchema), authController.refresh);

// POST /api/auth/logout
router.post("/logout", validate(logoutSchema), authController.logout);

module.exports = router;