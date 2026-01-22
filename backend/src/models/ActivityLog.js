const mongoose = require("mongoose");

const { Schema } = mongoose;

const activityLogSchema = new Schema(
  {
    // The action performed (create, update, delete, move, etc.)
    action: {
      type: String,
      enum: [
        "ticket.create",
        "ticket.update",
        "ticket.move",
        "ticket.delete",
        "comment.add",
        "comment.delete",
        "board.create",
        "board.update",
        "board.delete",
        "column.create",
        "column.update",
        "column.delete",
      ],
      required: true,
    },

    // The user who performed the action
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Type of entity affected (ticket, comment, board, column)
    entityType: {
      type: String,
      enum: ["ticket", "comment", "board", "column"],
      required: true,
    },

    // ID of the entity affected
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    // ID of the board this activity is related to
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },

    // Additional context/metadata about the action
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Create index on boardId and timestamp for efficient querying
activityLogSchema.index({ boardId: 1, createdAt: -1 });

// Create index on userId for querying user activities
activityLogSchema.index({ userId: 1, createdAt: -1 });

// Create compound index for filtering activities
activityLogSchema.index({ boardId: 1, entityType: 1, createdAt: -1 });

// Auto-expire documents after 90 days (optional cleanup)
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model("ActivityLog", activityLogSchema);
