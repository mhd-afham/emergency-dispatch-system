const express = require("express");
const router = express.Router();
const draftController = require("../controllers/draftController");
const { authenticate } = require("../middleware/auth");

/**
 * Draft Registration Routes
 * 
 * All routes require authentication and admin/supervisor role
 * 
 * Routes:
 * - POST   /api/drafts             - Save new draft
 * - GET    /api/drafts             - Get all user's drafts (optional ?type=vehicle|crew)
 * - GET    /api/drafts/:id         - Get specific draft
 * - PUT    /api/drafts/:id         - Update draft
 * - DELETE /api/drafts/:id         - Delete draft
 * - DELETE /api/drafts/cleanup/old - Clean up old drafts (admin only)
 */

// Apply authentication to all routes
router.use(authenticate);

// Middleware to check for Admin/Supervisor roles
const checkAdminOrSupervisor = (req, res, next) => {
  const allowedRoles = ['Admin', 'Supervisor'];
  
  if (!allowedRoles.includes(req.user.auth.role)) {
    return res.status(403).json({
      success: false,
      message: 'Insufficient permissions to manage drafts',
      requiredRoles: allowedRoles
    });
  }
  
  next();
};

router.use(checkAdminOrSupervisor);

/**
 * @route   POST /api/drafts
 * @desc    Save a new draft
 * @access  Private (Admin/Supervisor)
 */
router.post("/", draftController.saveDraft);

/**
 * @route   GET /api/drafts
 * @desc    Get all drafts for the authenticated user
 * @query   ?type=vehicle|crew (optional filter)
 * @access  Private (Admin/Supervisor)
 */
router.get("/", draftController.getAllDrafts);

/**
 * @route   DELETE /api/drafts/cleanup/old
 * @desc    Clean up old drafts (older than specified days)
 * @query   ?days=30 (default 30 days)
 * @access  Private (Admin only)
 */
router.delete("/cleanup/old", draftController.cleanupOldDrafts);

/**
 * @route   GET /api/drafts/:id
 * @desc    Get a specific draft by ID
 * @access  Private (Admin/Supervisor)
 */
router.get("/:id", draftController.getDraftById);

/**
 * @route   PUT /api/drafts/:id
 * @desc    Update an existing draft
 * @access  Private (Admin/Supervisor)
 */
router.put("/:id", draftController.updateDraft);

/**
 * @route   DELETE /api/drafts/:id
 * @desc    Delete a draft
 * @access  Private (Admin/Supervisor)
 */
router.delete("/:id", draftController.deleteDraft);

module.exports = router;
