const mongoose = require("mongoose");
const { Schema } = mongoose;

const activityLogSchema = new Schema(
  {
    // The action performed
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

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    entityType: {
      type: String,
      enum: ["ticket", "comment", "board", "column"],
      required: true,
    },

    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
    },

    entityName: {
      type: String,
      required: false,
    },

    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },

    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.index({ boardId: 1, createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ boardId: 1, entityType: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

module.exports = mongoose.model("ActivityLog", activityLogSchema);