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
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    }],
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
      default: "Backlog",
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        text: String,
        attachments: [
          {
            name: String,
            originalname: String,
            url: String,
            blobName: String,
            size: Number,
            format: String,
            mimetype: String,
          },
        ],
        replyTo: {
          commentId: {
            type: mongoose.Schema.Types.ObjectId,
          },
          text: String,
          userName: String,
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        name: String,
        originalname: String,
        url: String,
        blobName: String,
        public_id: String,
        size: Number,
        format: String,
        mimetype: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

taskSchema.pre("validate", function (next) {
  if (this.status === "Blocked" || this.status === "blocked") {
    this.status = "Backlog";
  }
  next();
});

taskSchema.pre("save", async function (next) {
  if (!this.taskID) {
    try {
      const TaskModel = mongoose.models.Task || this.constructor;
      let maxNum = 0;

      try {
        const result = await TaskModel.aggregate([
          { $match: { taskID: { $regex: /^TSK-\d+$/i } } },
          {
            $project: {
              taskNum: {
                $toInt: {
                  $arrayElemAt: [{ $split: ["$taskID", "-"] }, 1],
                },
              },
            },
          },
          { $sort: { taskNum: -1 } },
          { $limit: 1 },
        ]);
        if (result && result.length > 0 && typeof result[0].taskNum === "number") {
          maxNum = result[0].taskNum;
        }
      } catch (aggErr) {
        const tasks = await TaskModel.find({ taskID: { $regex: /^TSK-\d+$/i } }, { taskID: 1 })
          .sort({ _id: -1 })
          .limit(200)
          .lean();
        for (const t of tasks) {
          const match = t.taskID && t.taskID.match(/^TSK-(\d+)$/i);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      }

      const count = await TaskModel.countDocuments();
      let nextNum = Math.max(maxNum, count) + 1;

      let candidateId = `TSK-${String(nextNum).padStart(3, "0")}`;
      while (await TaskModel.exists({ taskID: candidateId })) {
        nextNum++;
        candidateId = `TSK-${String(nextNum).padStart(3, "0")}`;
      }

      this.taskID = candidateId;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);
module.exports = Task;
