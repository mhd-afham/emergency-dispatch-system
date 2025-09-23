const express = require("express");
const {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncident,
  mergeIncidents,
  getIncidentStats,
  checkDuplicates,
} = require("../controllers/incidentController");

const { authenticate, authorize, auditLog } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public incident routes (all authenticated users can read)
router.get(
  "/",
  auditLog("VIEW_INCIDENTS", "INCIDENT_MANAGEMENT"),
  getIncidents
);

router.get(
  "/stats",
  authorize(["Dispatcher", "Supervisor", "Admin"]),
  auditLog("VIEW_INCIDENT_STATS", "INCIDENT_MANAGEMENT"),
  getIncidentStats
);

router.get(
  "/:id",
  auditLog("VIEW_INCIDENT", "INCIDENT_MANAGEMENT"),
  getIncidentById
);

// Incident creation and management (Call Takers, Dispatchers, Supervisors, Admins)
router.post(
  "/",
  authorize(["Call Taker", "Dispatcher", "Supervisor", "Admin"]),
  auditLog("CREATE_INCIDENT", "INCIDENT_MANAGEMENT"),
  createIncident
);

router.put(
  "/:id",
  authorize(["Call Taker", "Dispatcher", "Supervisor", "Admin"]),
  auditLog("UPDATE_INCIDENT", "INCIDENT_MANAGEMENT"),
  updateIncident
);

// Duplicate checking and merging
router.post(
  "/check-duplicates",
  authorize(["Call Taker", "Dispatcher", "Supervisor", "Admin"]),
  auditLog("CHECK_DUPLICATES", "INCIDENT_MANAGEMENT"),
  checkDuplicates
);

router.post(
  "/:id/merge",
  authorize(["Call Taker", "Dispatcher", "Supervisor", "Admin"]),
  auditLog("MERGE_INCIDENTS", "INCIDENT_MANAGEMENT"),
  mergeIncidents
);

module.exports = router;