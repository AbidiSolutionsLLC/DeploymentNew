const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be positive"],
    },
    category: {
      type: String,
      enum: ["travel", "food", "supplies", "equipment", "other"],
      required: [true, "Category is required"],
    },
    receiptUrl: {
      type: String,
      required: [true, "Receipt is required"],
    },
    receiptPublicId: {
      type: String,
    },
    blobName: {
      type: String,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    submittedByName: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedByName: {
      type: String,
    },
    approvedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Update the updatedAt field on save
expenseSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Populate submittedBy and approvedBy automatically
expenseSchema.pre(/^find/, function (next) {
  this.populate({
    path: "submittedBy",
    select: "name email role department",
  }).populate({
    path: "approvedBy",
    select: "name email role",
  });
  next();
});

module.exports = mongoose.model("Expense", expenseSchema);