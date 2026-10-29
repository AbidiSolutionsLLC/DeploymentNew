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
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
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

    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },

    projectGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProjectGroup',
      default: null,
      index: true
    },
    statusOrder: [{ type: String, trim: true }],
    statuses: [{
      id: { type: String, trim: true },
      label: { type: String, required: true, trim: true },
      color: { type: String, default: null },
      order: { type: Number, default: 0 },
      category: {
        type: String,
        enum: ["backlog", "todo", "in_progress", "in_review", "done"],
        default: "todo"
      },
      isDefault: { type: Boolean, default: false }
    }],
    customStatuses: [{
      label: { type: String, required: true, trim: true },
      order: { type: Number, default: 0 },
      color: { type: String, default: null }
    }],
    milestones: [{
      title: { type: String, required: true, trim: true },
      dueDate: { type: Date },
      status: {
        type: String,
        enum: ["Planned", "In Progress", "Completed"],
        default: "Planned"
      }
    }]
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to generate projectID
projectSchema.pre("save", async function (next) {
  if (!this.projectID) {
    try {
      const ProjectModel = mongoose.models.Project || this.constructor;
      let maxNum = 0;

      try {
        const result = await ProjectModel.aggregate([
          { $match: { projectID: { $regex: /^PR-\d+$/i } } },
          {
            $project: {
              projNum: {
                $toInt: {
                  $arrayElemAt: [{ $split: ["$projectID", "-"] }, 1],
                },
              },
            },
          },
          { $sort: { projNum: -1 } },
          { $limit: 1 },
        ]);
        if (result && result.length > 0 && typeof result[0].projNum === "number") {
          maxNum = result[0].projNum;
        }
      } catch (aggErr) {
        const projects = await ProjectModel.find({ projectID: { $regex: /^PR-\d+$/i } }, { projectID: 1 })
          .sort({ _id: -1 })
          .limit(200)
          .lean();
        for (const p of projects) {
          const match = p.projectID && p.projectID.match(/^PR-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }

      const count = await ProjectModel.countDocuments();
      let nextNum = Math.max(maxNum, count) + 1;

      let candidateId = `PR-${String(nextNum).padStart(2, "0")}`;
      while (await ProjectModel.exists({ projectID: candidateId })) {
        nextNum++;
        candidateId = `PR-${String(nextNum).padStart(2, "0")}`;
      }

      this.projectID = candidateId;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Project = mongoose.models.Project || mongoose.model("Project", projectSchema);
module.exports = Project;
