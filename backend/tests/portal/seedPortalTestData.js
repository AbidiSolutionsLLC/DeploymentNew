const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

dotenv.config({ path: ".env.test" });

const Company = require("../../models/companySchema");
const Department = require("../../models/department");
const User = require("../../models/userSchema");
const Project = require("../../models/projectSchema");
const Task = require("../../models/taskSchema");
const ProjectGroup = require("../../models/projectGroupSchema");

const requireTestEnvironment = () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Portal test data can only be seeded with NODE_ENV=test");
  }
  if (!process.env.TEST_MONGODB_URI) {
    throw new Error("TEST_MONGODB_URI is required");
  }
};

const companyData = (suffix) => ({
  companyName: `Portal Test Company ${suffix}`,
  companyOwner: "Portal Test Owner",
  contactNo: `+1555000${suffix === "A" ? "001" : "002"}`,
  companyEmail: `portal-test-${suffix.toLowerCase()}@example.invalid`,
  website: `https://portal-test-${suffix.toLowerCase()}.example.invalid`,
  address: "Test-only address",
  noOfEmployees: 3,
  companyType: "Test",
});

const userData = ({ email, name, company, department, role }) => ({
  email,
  name,
  company,
  department,
  role,
  password: bcrypt.hashSync("PortalTestPassword!123", 10),
  empStatus: "Active",
});

async function seed() {
  requireTestEnvironment();
  await mongoose.connect(process.env.TEST_MONGODB_URI);

  await Promise.all([
    Task.deleteMany({ title: { $regex: /^Portal Test/ } }),
    ProjectGroup.deleteMany({ name: { $regex: /^Portal Test/ } }),
    Project.deleteMany({ title: { $regex: /^Portal Test/ } }),
    User.deleteMany({ email: { $regex: /^portal-test-/ } }),
    Department.deleteMany({ name: { $regex: /^Portal Test/ } }),
    Company.deleteMany({ companyEmail: { $regex: /^portal-test-/ } }),
  ]);

  const [companyA, companyB] = await Company.create([
    companyData("A"),
    companyData("B"),
  ]);

  const [departmentA, departmentB] = await Department.create([
    { name: "Portal Test Engineering A", company: companyA._id },
    { name: "Portal Test Engineering B", company: companyB._id },
  ]);

  const [adminA, employeeA, adminB] = await User.create([
    userData({
      email: "portal-test-admin-a@example.invalid",
      name: "Portal Test Admin A",
      company: companyA._id,
      department: departmentA._id,
      role: "Admin",
    }),
    userData({
      email: "portal-test-employee-a@example.invalid",
      name: "Portal Test Employee A",
      company: companyA._id,
      department: departmentA._id,
      role: "Employee",
    }),
    userData({
      email: "portal-test-admin-b@example.invalid",
      name: "Portal Test Admin B",
      company: companyB._id,
      department: departmentB._id,
      role: "Admin",
    }),
  ]);

  const [projectA, projectB] = await Project.create([
    {
      projectID: "PORTAL-TEST-A",
      title: "Portal Test Project A",
      description: "Owned by test company A",
      status: "Active",
      owner: adminA._id,
      team: [adminA._id, employeeA._id],
      company: companyA._id,
      department: departmentA._id,
    },
    {
      projectID: "PORTAL-TEST-B",
      title: "Portal Test Project B",
      description: "Owned by test company B",
      status: "Active",
      owner: adminB._id,
      team: [adminB._id],
      company: companyB._id,
      department: departmentB._id,
    },
  ]);

  const [taskA, taskB] = await Task.create([
    {
      taskID: "PORTAL-TEST-TASK-A",
      title: "Portal Test Task A",
      description: "Task in company A",
      company: companyA._id,
      project: projectA._id,
      team: [adminA._id, employeeA._id],
      duration: 2,
      status: "In Progress",
      completionPercent: 50,
    },
    {
      taskID: "PORTAL-TEST-TASK-B",
      title: "Portal Test Task B",
      description: "Task in company B",
      company: companyB._id,
      project: projectB._id,
      team: [adminB._id],
      duration: 1,
      status: "Todo",
    },
  ]);

  const [groupA] = await ProjectGroup.create([
    {
      name: "Portal Test Group A",
      description: "Group in company A",
      owner: adminA._id,
      projects: [projectA._id],
      company: companyA._id,
    },
  ]);

  console.log(JSON.stringify({
    users: {
      adminA: adminA._id.toString(),
      employeeA: employeeA._id.toString(),
      adminB: adminB._id.toString(),
    },
    companies: {
      companyA: companyA._id.toString(),
      companyB: companyB._id.toString(),
    },
    projects: {
      projectA: projectA._id.toString(),
      projectB: projectB._id.toString(),
    },
    tasks: {
      taskA: taskA._id.toString(),
      taskB: taskB._id.toString(),
    },
    groupA: groupA._id.toString(),
  }, null, 2));
}

seed()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
