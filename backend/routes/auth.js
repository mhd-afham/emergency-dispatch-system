const express = require("express");
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require("../controllers/authController");

const { authenticate, auditLog } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", auditLog("REGISTER", "USER_ACCOUNT"), register);
router.post("/login", auditLog("LOGIN", "USER_ACCOUNT"), login);
router.post("/logout", auditLog("LOGOUT", "USER_ACCOUNT"), logout);
router.post(
  "/forgot-password",
  auditLog("FORGOT_PASSWORD", "USER_ACCOUNT"),
  forgotPassword
);
router.put(
  "/reset-password/:resettoken",
  auditLog("RESET_PASSWORD", "USER_ACCOUNT"),
  resetPassword
);
router.get(
  "/verify-email/:token",
  auditLog("VERIFY_EMAIL", "USER_ACCOUNT"),
  verifyEmail
);

// Protected routes (require authentication)
router.get(
  "/me",
  authenticate,
  auditLog("VIEW_PROFILE", "USER_PROFILE"),
  getMe
);
router.put(
  "/profile",
  authenticate,
  auditLog("UPDATE_PROFILE", "USER_PROFILE"),
  updateProfile
);
router.put(
  "/password",
  authenticate,
  auditLog("CHANGE_PASSWORD", "USER_ACCOUNT"),
  updatePassword
);

module.exports = router;
