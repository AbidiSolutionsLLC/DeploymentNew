const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Department name is required"],
    unique: true,
    trim: true
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // The head of this department
    default: null
  },
  // HIERARCHY: Point to the parent department
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    default: null 
  },
  // Array of users belonging to this department
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  description: String,
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// VIRTUAL: To see child departments (e.g., querying 'Headquarters' shows 'Engineering', 'HR')
departmentSchema.virtual('subDepartments', {
  ref: 'Department',
  localField: '_id',
  foreignField: 'parentDepartment'
});

module.exports = mongoose.model("Department", departmentSchema);