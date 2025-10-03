const RegistrationDraft = require("../models/RegistrationDraft");
const AuditLog = require("../models/AuditLog");

/**
 * Draft Registration Controller
 * 
 * Handles all draft-related operations:
 * - Save draft (create new)
 * - Update draft (edit existing)
 * - Get all drafts (by user or type)
 * - Get single draft
 * - Delete draft
 * - Submit draft (convert to actual registration)
 */

/**
 * @desc    Save a new draft
 * @route   POST /api/drafts
 * @access  Private (Admin/Supervisor)
 */
exports.saveDraft = async (req, res) => {
  try {
    const { registrationType, draftTitle, formData, currentStep } = req.body;

    // Validation
    if (!registrationType || !draftTitle || !formData) {
      return res.status(400).json({
        success: false,
        message: "Registration type, draft title, and form data are required",
      });
    }

    if (!["vehicle", "crew"].includes(registrationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration type. Must be 'vehicle' or 'crew'",
      });
    }

    // Create new draft
    const draft = new RegistrationDraft({
      registrationType,
      draftTitle,
      formData,
      currentStep: currentStep || 1,
      audit: {
        createdBy: req.user._id,
      },
    });

    // Calculate completion percentage
    draft.calculateCompletion();

    await draft.save();

    // Log action
    await AuditLog.create({
      userId: req.user._id,
      action: "CREATE_DRAFT",
      target: "RegistrationDraft",
      targetId: draft._id,
      details: {
        registrationType,
        draftTitle,
        currentStep,
      },
    });

    res.status(201).json({
      success: true,
      message: "Draft saved successfully",
      data: {
        draft: draft,
      },
    });
  } catch (error) {
    console.error("Error saving draft:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save draft",
      error: error.message,
    });
  }
};

/**
 * @desc    Update an existing draft
 * @route   PUT /api/drafts/:id
 * @access  Private (Admin/Supervisor)
 */
exports.updateDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { draftTitle, formData, currentStep } = req.body;

    // Find draft
    const draft = await RegistrationDraft.findById(id);

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    // Check ownership (only creator can update)
    if (draft.audit.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only update your own drafts",
      });
    }

    // Update fields
    if (draftTitle) draft.draftTitle = draftTitle;
    if (formData) draft.formData = formData;
    if (currentStep) draft.currentStep = currentStep;

    // Recalculate completion
    draft.calculateCompletion();

    await draft.save();

    // Log action
    await AuditLog.create({
      userId: req.user._id,
      action: "UPDATE_DRAFT",
      target: "RegistrationDraft",
      targetId: draft._id,
      details: {
        draftTitle: draft.draftTitle,
        currentStep: draft.currentStep,
        completionPercentage: draft.completionPercentage,
      },
    });

    res.json({
      success: true,
      message: "Draft updated successfully",
      data: {
        draft: draft,
      },
    });
  } catch (error) {
    console.error("Error updating draft:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update draft",
      error: error.message,
    });
  }
};

/**
 * @desc    Get all drafts (optionally filtered by type)
 * @route   GET /api/drafts?type=vehicle|crew
 * @access  Private (Admin/Supervisor)
 */
exports.getAllDrafts = async (req, res) => {
  try {
    const { type } = req.query;

    let query = {
      "audit.createdBy": req.user._id,
      status: "draft",
    };

    if (type && ["vehicle", "crew"].includes(type)) {
      query.registrationType = type;
    }

    const drafts = await RegistrationDraft.find(query)
      .populate("audit.createdBy", "firstName lastName email")
      .sort({ "audit.updatedAt": -1 });

    res.json({
      success: true,
      count: drafts.length,
      data: {
        drafts: drafts,
      },
    });
  } catch (error) {
    console.error("Error retrieving drafts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve drafts",
      error: error.message,
    });
  }
};

/**
 * @desc    Get a single draft by ID
 * @route   GET /api/drafts/:id
 * @access  Private (Admin/Supervisor)
 */
exports.getDraftById = async (req, res) => {
  try {
    const { id } = req.params;

    const draft = await RegistrationDraft.findById(id).populate(
      "audit.createdBy",
      "firstName lastName email"
    );

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    // Check ownership
    if (draft.audit.createdBy._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only view your own drafts",
      });
    }

    res.json({
      success: true,
      data: {
        draft: draft,
      },
    });
  } catch (error) {
    console.error("Error retrieving draft:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve draft",
      error: error.message,
    });
  }
};

/**
 * @desc    Delete a draft
 * @route   DELETE /api/drafts/:id
 * @access  Private (Admin/Supervisor)
 */
exports.deleteDraft = async (req, res) => {
  try {
    const { id } = req.params;

    const draft = await RegistrationDraft.findById(id);

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: "Draft not found",
      });
    }

    // Check ownership
    if (draft.audit.createdBy.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own drafts",
      });
    }

    await draft.deleteOne();

    // Log action
    await AuditLog.create({
      userId: req.user._id,
      action: "DELETE_DRAFT",
      target: "RegistrationDraft",
      targetId: draft._id,
      details: {
        registrationType: draft.registrationType,
        draftTitle: draft.draftTitle,
      },
    });

    res.json({
      success: true,
      message: "Draft deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting draft:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete draft",
      error: error.message,
    });
  }
};

/**
 * @desc    Clean up old drafts (older than 30 days)
 * @route   DELETE /api/drafts/cleanup/old
 * @access  Private (Admin only)
 */
exports.cleanupOldDrafts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can perform cleanup operations",
      });
    }

    const daysOld = parseInt(req.query.days) || 30;
    const result = await RegistrationDraft.cleanupOldDrafts(daysOld);

    // Log action
    await AuditLog.create({
      userId: req.user._id,
      action: "CLEANUP_DRAFTS",
      target: "RegistrationDraft",
      details: {
        daysOld,
        deletedCount: result.deletedCount,
      },
    });

    res.json({
      success: true,
      message: `Successfully cleaned up ${result.deletedCount} old drafts`,
      data: {
        deletedCount: result.deletedCount,
        daysOld,
      },
    });
  } catch (error) {
    console.error("Error cleaning up old drafts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clean up old drafts",
      error: error.message,
    });
  }
};

module.exports = exports;
