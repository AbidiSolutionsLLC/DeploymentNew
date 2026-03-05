// taskSchema.js
const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskID: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    dueDate: {
      type: Date,
    },
    duration: {
      type: Number, 
    },
    completionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    workedHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["Todo", "In Progress", "In Review", "Done"],
      default: "Todo",
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        public_id: String,
        url: String,
        originalname: String,
        format: String,
        size: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

taskSchema.pre("save", async function (next) {
  if (!this.taskID) {
    const count = await mongoose.models.Task.countDocuments();
    this.taskID = `TSK-${String(count + 1).padStart(3, "0")}`;
  }
  next();
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
module.exports = Task;
