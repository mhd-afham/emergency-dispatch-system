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
  verifyResetToken,
  validatePassword,
  verifyEmail,
  adminCreateUser,
} = require("../controllers/authController");

const { authenticate, auditLog, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes
router.post("/register", auditLog("REGISTER", "USER_ACCOUNT"), register);
router.post("/login", auditLog("LOGIN", "USER_ACCOUNT"), login);
router.post("/logout", auditLog("LOGOUT", "USER_ACCOUNT"), logout);
router.post("/validate-password", validatePassword);
router.post(
  "/verify-reset-token",
  auditLog("VERIFY_RESET_TOKEN", "USER_ACCOUNT"),
  verifyResetToken
);
router.post(
  "/forgot-password",
  auditLog("FORGOT_PASSWORD", "USER_ACCOUNT"),
  forgotPassword
);
router.post(
  "/reset-password",
  auditLog("RESET_PASSWORD", "USER_ACCOUNT"),
  resetPassword
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

// Admin routes
router.post(
  "/admin/create-user",
  authenticate,
  authorize("Admin"),
  auditLog("CREATE_USER", "USER_MANAGEMENT"),
  adminCreateUser
);

module.exports = router;
