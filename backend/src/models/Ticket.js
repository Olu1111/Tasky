const mongoose = require("mongoose");

const { Schema } = mongoose;

const ticketSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    column: { type: Schema.Types.ObjectId, ref: "Column", required: true },
    assignee: { type: Schema.Types.ObjectId, ref: "User" },
    position: { type: Number, default: 0 },
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Ticket", ticketSchema);
