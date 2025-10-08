const express = require("express");
const router = express.Router();
const CrewController = require("../controllers/crewController");
const { authenticate, authorize, selfOrAdmin } = require("../middleware/auth");

// Apply authentication middleware to all crew routes
router.use(authenticate);

// POST /api/crew - Register a new crew member
router.post("/", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to register crew members",
      requiredRoles: allowedRoles,
      currentRole: req.user.auth.role,
    });
  }
  CrewController.registerCrewMember(req, res, next);
});

// GET /api/crew - Get all crew members
router.get("/", CrewController.getAllCrewMembers);

// GET /api/crew/pending-approval - Get pending approvals
router.get("/pending-approval", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view pending crew approvals",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.getPendingApprovals(req, res, next);
});

// GET /api/crew/approved - Get approved crew
router.get("/approved", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view approved crew",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.getApprovedCrew(req, res, next);
});

// GET /api/crew/rejected - Get rejected crew
router.get("/rejected", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view rejected crew",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.getRejectedCrew(req, res, next);
});

// GET /api/crew/available - Get available crew
router.get("/available", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Supervisor", "Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view available crew",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.getAvailableCrewByRole(req, res, next);
});

// GET /api/crew/expiring-certifications - Get expiring certifications
router.get("/expiring-certifications", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view expiring certifications",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.getExpiringCertifications(req, res, next);
});

// POST /api/crew/validate-employee-id - Validate employee ID
router.post("/validate-employee-id", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to validate employee ID",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.validateEmployeeId(req, res, next);
});

// POST /api/crew/validate-email - Validate email
router.post("/validate-email", (req, res, next) => {
  const allowedRoles = ["Admin", "Supervisor"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to validate email",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.validateEmail(req, res, next);
});

// GET /api/crew/statistics - Get crew statistics
router.get("/statistics", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin", "Data Analyst"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view crew statistics",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.getCrewStatistics(req, res, next);
});

// GET /api/crew/:id - Get specific crew member
router.get("/:id", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin", "Dispatcher"];
  const isSelf =
    req.user._id.toString() === req.params.id ||
    (req.user.auth.employeeId &&
      req.params.id.includes(req.user.auth.employeeId));
  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view this crew member",
    });
  }
  CrewController.getCrewMemberById(req, res, next);
});

// PUT /api/crew/:id - Update crew member
router.put("/:id", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  const isSelf =
    req.user._id.toString() === req.params.id ||
    (req.user.auth.employeeId &&
      req.params.id.includes(req.user.auth.employeeId));
  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update this crew member",
    });
  }
  CrewController.updateCrewMember(req, res, next);
});

// PUT /api/crew/:id/availability - Update availability
router.put("/:id/availability", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Supervisor", "Admin"];
  const isSelf =
    req.user._id.toString() === req.params.id ||
    (req.user.auth.employeeId &&
      req.params.id.includes(req.user.auth.employeeId));
  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update crew availability",
    });
  }
  CrewController.updateCrewStatus(req, res, next);
});

// POST /api/crew/:id/approve - Approve crew member
router.post("/:id/approve", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to approve crew members",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.approveCrew(req, res, next);
});

// POST /api/crew/:id/reject - Reject crew member
router.post("/:id/reject", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to reject crew members",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.rejectCrew(req, res, next);
});

// PATCH /api/crew/:id/clear-rejection - Clear rejection
router.patch("/:id/clear-rejection", (req, res, next) => {
  const allowedRoles = ["Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to clear rejection status",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.clearRejection(req, res, next);
});

// PUT /api/crew/:id/status - Update status
router.put("/:id/status", (req, res, next) => {
  const allowedRoles = ["Dispatcher", "Supervisor", "Admin"];
  const isSelf =
    req.user._id.toString() === req.params.id ||
    (req.user.auth.employeeId &&
      req.params.id.includes(req.user.auth.employeeId));
  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update crew status",
    });
  }
  CrewController.updateCrewStatus(req, res, next);
});

// PUT /api/crew/:id/location - Update location
router.put("/:id/location", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  const isSelf =
    req.user._id.toString() === req.params.id ||
    (req.user.auth.employeeId &&
      req.params.id.includes(req.user.auth.employeeId));
  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update crew location",
    });
  }
  CrewController.updateCrewLocation(req, res, next);
});

// POST /api/crew/:id/certifications - Add certification
router.post("/:id/certifications", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to add certifications",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.addCertification(req, res, next);
});

// PUT /api/crew/:id/certifications/:certId - Update certification
router.put("/:id/certifications/:certId", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to update certifications",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.updateCertification(req, res, next);
});

// DELETE /api/crew/:id/certifications/:certId - Deactivate certification
router.delete("/:id/certifications/:certId", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to deactivate certifications",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.deactivateCertification(req, res, next);
});

// DELETE /api/crew/:id - Delete crew member
router.delete("/:id", (req, res, next) => {
  const allowedRoles = ["Admin"];
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to delete crew members",
      requiredRoles: allowedRoles,
    });
  }
  CrewController.deleteCrewPermanently(req, res, next);
});

// GET /api/crew/:id/history - Get crew history
router.get("/:id/history", (req, res, next) => {
  const allowedRoles = ["Supervisor", "Admin", "Dispatcher"];
  const isSelf =
    req.user._id.toString() === req.params.id ||
    (req.user.auth.employeeId &&
      req.params.id.includes(req.user.auth.employeeId));
  if (!allowedRoles.includes(req.user.auth.role) && !isSelf) {
    return res.status(403).json({
      success: false,
      message: "Insufficient permissions to view crew history",
    });
  }
  CrewController.getCrewHistory(req, res, next);
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error("Crew route error:", error);
  if (error.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `A crew member with this ${field} already exists`,
      field,
    });
  }
  if (error.name === "CastError" && error.kind === "ObjectId") {
    return res.status(400).json({
      success: false,
      message: "Invalid crew member ID format",
    });
  }
  res.status(500).json({
    success: false,
    message: "Internal server error in crew operations",
    error:
      process.env.NODE_ENV === "development"
        ? error.message
        : "Something went wrong",
  });
});

module.exports = router;
