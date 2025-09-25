const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    // Message Details
    type: {
      type: String,
      required: [true, "Communication type is required"],
      enum: [
        "incident_dispatch",
        "incident_update",
        "status_change",
        "emergency_alert",
        "system_notification",
        "crew_message",
        "resource_request",
        "operational_update",
      ],
    },
    priority: {
      type: String,
      required: [true, "Priority is required"],
      enum: ["low", "normal", "high", "urgent", "emergency"],
      default: "normal",
    },
    status: {
      type: String,
      required: [true, "Status is required"],
      enum: ["sent", "delivered", "read", "failed", "cancelled"],
      default: "sent",
    },

    // Content
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },
    attachments: [
      {
        filename: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: ["image", "document", "audio", "video", "other"],
          default: "document",
        },
        size: {
          type: Number, // in bytes
          min: 0,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Sender and Recipients
    sender: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      role: {
        type: String,
        required: true,
        enum: ["admin", "dispatcher", "crew_chief", "crew_member", "system"],
      },
    },

    recipients: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        role: {
          type: String,
          required: true,
          enum: ["admin", "dispatcher", "crew_chief", "crew_member"],
        },
        deliveryStatus: {
          type: String,
          enum: ["pending", "sent", "delivered", "read", "failed"],
          default: "pending",
        },
        deliveredAt: Date,
        readAt: Date,
        acknowledgmentRequired: {
          type: Boolean,
          default: false,
        },
        acknowledgedAt: Date,
      },
    ],

    // Context and References
    context: {
      incidentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incident",
      },
      assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
      },
      vehicleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vehicle",
      },
      stationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Station",
      },
      shiftId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shift",
      },
    },

    // Location
    location: {
      coordinates: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          validate: {
            validator: function (coords) {
              if (!coords || coords.length !== 2) return true; // Optional field
              const [lng, lat] = coords;
              return lng >= 79.5 && lng <= 81.9 && lat >= 5.9 && lat <= 9.9;
            },
            message: "Coordinates must be within Sri Lankan boundaries",
          },
        },
      },
      address: {
        type: String,
        trim: true,
        maxlength: [200, "Address cannot exceed 200 characters"],
      },
    },

    // Timing
    timing: {
      sentAt: {
        type: Date,
        default: Date.now,
      },
      scheduledFor: Date, // For scheduled messages
      expiresAt: Date, // For time-sensitive messages
      lastAttemptAt: Date,
      nextRetryAt: Date,
    },

    // Delivery and Response
    delivery: {
      method: {
        type: String,
        enum: ["in_app", "sms", "email", "radio", "push_notification", "all"],
        default: "in_app",
      },
      attempts: {
        type: Number,
        min: 0,
        default: 0,
      },
      maxAttempts: {
        type: Number,
        min: 1,
        default: 3,
      },
      lastError: String,
    },

    // Response and Follow-up
    responseRequired: {
      type: Boolean,
      default: false,
    },
    responseDeadline: Date,
    responses: [
      {
        responderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        response: {
          type: String,
          required: true,
          maxlength: [1000, "Response cannot exceed 1000 characters"],
        },
        respondedAt: {
          type: Date,
          default: Date.now,
        },
        attachments: [
          {
            filename: String,
            url: String,
            type: {
              type: String,
              enum: ["image", "document", "audio", "video", "other"],
              default: "document",
            },
          },
        ],
      },
    ],

    // Threading
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Communication",
    },
    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Communication",
    },
    isThread: {
      type: Boolean,
      default: false,
    },

    // Audit Fields
    audit: {
      createdAt: {
        type: Date,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
  },
  {
    timestamps: true,
    collection: "communications",
  }
);

// Indexes for performance
communicationSchema.index({ "sender.userId": 1 });
communicationSchema.index({ "recipients.userId": 1 });
communicationSchema.index({ type: 1 });
communicationSchema.index({ priority: 1 });
communicationSchema.index({ status: 1 });
communicationSchema.index({ "timing.sentAt": -1 });
communicationSchema.index({ "context.incidentId": 1 });
communicationSchema.index({ "context.assignmentId": 1 });
communicationSchema.index({ threadId: 1 });
communicationSchema.index({ replyToId: 1 });

// Compound indexes
communicationSchema.index({ type: 1, "timing.sentAt": -1 });
communicationSchema.index({ priority: 1, status: 1 });
communicationSchema.index({ "recipients.userId": 1, "timing.sentAt": -1 });
communicationSchema.index({ "context.incidentId": 1, "timing.sentAt": -1 });

// Pre-save middleware
communicationSchema.pre("save", function (next) {
  this.audit.updatedAt = Date.now();

  // Set thread properties
  if (this.replyToId && !this.threadId) {
    this.threadId = this.replyToId;
  }

  // Update overall status based on recipients
  if (this.recipients && this.recipients.length > 0) {
    const statuses = this.recipients.map((r) => r.deliveryStatus);

    if (statuses.every((s) => s === "delivered" || s === "read")) {
      this.status = "delivered";
    } else if (statuses.some((s) => s === "failed")) {
      this.status = "failed";
    } else if (statuses.some((s) => s === "read")) {
      this.status = "read";
    }
  }

  next();
});

// Virtual for unread count
communicationSchema.virtual("unreadCount").get(function () {
  if (!this.recipients) return 0;
  return this.recipients.filter((r) => r.deliveryStatus !== "read").length;
});

// Virtual for acknowledgment status
communicationSchema.virtual("acknowledgmentStatus").get(function () {
  if (!this.recipients) return { required: 0, acknowledged: 0 };

  const required = this.recipients.filter(
    (r) => r.acknowledgmentRequired
  ).length;
  const acknowledged = this.recipients.filter((r) => r.acknowledgedAt).length;

  return { required, acknowledged };
});

// Method to mark as read by user
communicationSchema.methods.markAsRead = function (userId) {
  const recipient = this.recipients.find(
    (r) => r.userId.toString() === userId.toString()
  );
  if (recipient && recipient.deliveryStatus !== "read") {
    recipient.deliveryStatus = "read";
    recipient.readAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to acknowledge message
communicationSchema.methods.acknowledge = function (userId) {
  const recipient = this.recipients.find(
    (r) => r.userId.toString() === userId.toString()
  );
  if (
    recipient &&
    recipient.acknowledgmentRequired &&
    !recipient.acknowledgedAt
  ) {
    recipient.acknowledgedAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to add response
communicationSchema.methods.addResponse = function (
  responderId,
  responseText,
  attachments = []
) {
  this.responses.push({
    responderId,
    response: responseText,
    attachments,
    respondedAt: new Date(),
  });

  return this.save();
};

// Method to retry failed delivery
communicationSchema.methods.retryDelivery = function () {
  if (this.delivery.attempts >= this.delivery.maxAttempts) {
    throw new Error("Maximum delivery attempts exceeded");
  }

  this.delivery.attempts += 1;
  this.timing.lastAttemptAt = new Date();
  this.timing.nextRetryAt = null;
  this.status = "sent";

  // Reset failed recipients to pending
  this.recipients.forEach((recipient) => {
    if (recipient.deliveryStatus === "failed") {
      recipient.deliveryStatus = "pending";
    }
  });

  return this.save();
};

// Static method to find communications by recipient
communicationSchema.statics.findByRecipient = function (userId, options = {}) {
  const query = {
    "recipients.userId": userId,
  };

  if (options.unreadOnly) {
    query["recipients.deliveryStatus"] = { $ne: "read" };
  }

  if (options.type) {
    query.type = options.type;
  }

  return this.find(query)
    .populate("sender.userId context.incidentId context.assignmentId")
    .sort({ "timing.sentAt": -1 })
    .limit(options.limit || 50);
};

// Static method to find thread messages
communicationSchema.statics.findThread = function (threadId) {
  return this.find({
    $or: [{ _id: threadId }, { threadId: threadId }],
  })
    .populate("sender.userId")
    .sort({ "timing.sentAt": 1 });
};

// Static method to broadcast to multiple users
communicationSchema.statics.broadcast = function (messageData, recipientIds) {
  const recipients = recipientIds.map((id) => ({
    userId: id.userId || id,
    name: id.name || "Unknown",
    role: id.role || "crew_member",
    deliveryStatus: "pending",
  }));

  const communication = new this({
    ...messageData,
    recipients,
  });

  return communication.save();
};

// Static method to find urgent undelivered messages
communicationSchema.statics.findUrgentUndelivered = function () {
  return this.find({
    priority: { $in: ["urgent", "emergency"] },
    status: { $in: ["sent", "failed"] },
    "timing.sentAt": {
      $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
    },
  })
    .populate("sender.userId recipients.userId")
    .sort({ priority: -1, "timing.sentAt": -1 });
};

module.exports = mongoose.model("Communication", communicationSchema);
