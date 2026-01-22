const mongoose = require("mongoose");

const { Schema } = mongoose;

const ticketSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
      type: String,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"]
    },
    priority: {
      type: String,
      enum: {
        values: ["Low", "Medium", "High"],
        message: "Priority must be Low, Medium, or High"
      },
      default: "Medium"
    },
    status: {
      type: String,
      enum: {
        values: ["backlog", "todo", "in_progress", "review", "done"],
        message: "Status must be backlog, todo, in_progress, review, or done"
      },
      default: "backlog"
    },
    board: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: [true, "Board reference is required"]
    },
    column: {
      type: Schema.Types.ObjectId,
      ref: "Column",
      required: [true, "Column reference is required"]
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"]
    },
    position: {
      type: Number,
      default: 0,
      min: [0, "Position cannot be negative"]
    },
    comments: [{
      type: Schema.Types.ObjectId,
      ref: "Comment"
    }],
    deletedAt: {
      type: Date,
      default: null
    },
  },
  { timestamps: true }
);

ticketSchema.index({ board: 1, column: 1, position: 1 }); 
ticketSchema.index({ assignee: 1 }); 
ticketSchema.index({ createdBy: 1 }); 
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ title: "text", description: "text" });
ticketSchema.pre("save", async function () {

  if (!this.assignee) return;

  const User = mongoose.model("User");

  const userExists = await User.exists({ _id: this.assignee });
  if (!userExists) {
    const err = new mongoose.Error.ValidationError(this);
    err.addError(
      "assignee",
      new mongoose.Error.ValidatorError({
        message: "Assignee must be a valid user",
        path: "assignee",
        value: this.assignee,
      })
    );
    throw err; 
  }
});

ticketSchema.methods.populateDetails = async function() {
  return await this.populate([
    { path: 'assignee', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
    { path: 'comments' },
    { path: 'board', select: 'title' },
    { path: 'column', select: 'title' }
  ]);
};

ticketSchema.statics.syncStatusWithColumn = async function() {
  const tickets = await this.find({ deletedAt: null }).populate('column');
  
  for (const ticket of tickets) {
    if (ticket.column) {
      const statusMap = {
        'Backlog': 'backlog',
        'Todo': 'todo', 
        'Doing': 'in_progress',
        'Reviewing': 'review',
        'Finished': 'done'
      };
      
      const newStatus = statusMap[ticket.column.title] || 'backlog';
      if (ticket.status !== newStatus) {
        await this.findByIdAndUpdate(ticket._id, { status: newStatus });
      }
    }
  }
  
  console.log('Status sync completed for existing tickets');
};

ticketSchema.statics.canUserAccess = async function(ticketId, userId) {
  const ticket = await this.findById(ticketId).populate('board');
  if (!ticket || ticket.deletedAt) return false;
  const board = ticket.board;
  return board.owner.toString() === userId.toString() || 
          (board.members && board.members.some(member => member.toString() === userId.toString()));
};
ticketSchema.virtual('isDeleted').get(function() {
  return !!this.deletedAt;
});

ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model("Ticket", ticketSchema);