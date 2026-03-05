// projectSchema.js
const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectID: {
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
    status: {
      type: String,
      enum: ["Planning", "Active", "On Hold", "Completed", "Cancelled"],
      default: "Planning",
    },
    team: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    strict: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    attachments: [
      {
        public_id: String,
        url: String,
        originalname: String,
        format: String,
        size: Number,
      },
    ],
    status: {
      type: String,
      enum: ['Open', 'In Progress', 'On Hold', 'Completed'],
      default: 'Open',
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate projectID
projectSchema.pre("save", async function (next) {
  if (!this.projectID) {
    const count = await mongoose.models.Project.countDocuments();
    this.projectID = `PR-${String(count + 1).padStart(2, "0")}`;
  }
  next();
});

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
module.exports = Project;
