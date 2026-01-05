const mongoose = require("mongoose");

const { Schema } = mongoose;

const columnSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    board: { type: Schema.Types.ObjectId, ref: "Board", required: true },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Column", columnSchema);
