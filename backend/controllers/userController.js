const User = require("../models/userSchema");
const Department = require("../models/departemt"); // Make sure this model exists
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError } = require("../utils/ExpressError");
const { sendInvitationEmail } = require("../config/emailConfig");

const generateEmpID = async () => {
  const lastUser = await User.findOne({}, { empID: 1 }).sort({ createdAt: -1 });

  if (!lastUser || !lastUser.empID || !lastUser.empID.startsWith("EMP-")) {
    return "EMP-001";
  }

  const lastIdStr = lastUser.empID.split("-")[1];
  const lastIdNum = parseInt(lastIdStr, 10);

  if (isNaN(lastIdNum)) return "EMP-001";

  return `EMP-${String(lastIdNum + 1).padStart(3, "0")}`;
};

// 1. Create User
exports.createUser = catchAsync(async (req, res) => {
  const {
    name,
    email,
    timeZone,
    reportsTo,
    role,
    phoneNumber,
    designation,
    department,
    branch,
    empType,
    joiningDate,
    about,
    salary,
    education,
    address,
    experience,
    DOB,
    maritalStatus,
    emergencyContact,
    addedby,
  } = req.body;

  // 1. Check if email exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError("User with this email already exists");
  }

  const newEmpID = await generateEmpID();


  const newUser = new User({
    name,
    email,
    timeZone: timeZone || "UTC",
    reportsTo: reportsTo || null,
    empID: newEmpID,
    role,
    phoneNumber,
    designation,
    department,
    branch,
    empType,
    joiningDate,
    about,
    salary,
    education,
    address,
    experience,
    DOB,
    maritalStatus,
    emergencyContact,
    addedby,
  });

  // 3. Save User
  const savedUser = await newUser.save();

  // 4. AUTO-LINK: Add this User to the Department's "members" array
  if (department) {
    await Department.findByIdAndUpdate(department, {
      $push: { members: savedUser._id },
    });
  }

  // 5. Send Invitation Email
  // Replace with your actual frontend URL
  const frontendLoginUrl = process.env.FRONTEND_URL || "http://localhost:3000/auth/login";

  await sendInvitationEmail({
    to: savedUser.email,
    name: savedUser.name,
    role: savedUser.role,
    loginURL: frontendLoginUrl
  });

  res.status(201).json({
    status: "success",
    message: "User created and invitation email sent.",
    data: savedUser,
  });
});
// 2. Get All Users
exports.getAllUsers = catchAsync(async (req, res) => {
  // Populate Department name and Manager name for the UI
  const users = await User.find()
    .populate("department", "name") // Only fetch department name
    .populate("reportsTo", "name designation"); // Only fetch manager name & role

  res.status(200).json(users);
});

// 3. Get User by ID
exports.getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id)
    .populate({
      path: "department",
      populate: {
        path: "members",
        model: "User",
        select: "name email designation avatar role empStatus"
      }
    })
    .populate({
      path: "reportsTo",
      select: "name email designation avatar role"
    });

  if (!user) throw new NotFoundError("User not found");

  res.status(200).json(user);
});

// 4. Update User
exports.updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // Fix: Handle empty/invalid reportsTo value to avoid CastError
  if (updates.reportsTo === "" || updates.reportsTo === "NO MANAGER") {
    updates.reportsTo = null;
  }

  // Find original user to check for department changes
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User not found");

  // --- HANDLE DEPARTMENT TRANSFER ---
  // If department is changing, update the old and new department lists
  if (updates.department && updates.department !== user.department?.toString()) {
    const oldDeptId = user.department;
    const newDeptId = updates.department;

    // Remove from Old Department
    if (oldDeptId) {
      await Department.findByIdAndUpdate(oldDeptId, {
        $pull: { members: id }
      });
    }

    // Add to New Department
    if (newDeptId) {
      await Department.findByIdAndUpdate(newDeptId, {
        $push: { members: id }
      });
    }
  }
  // ----------------------------------

  // Filter allowed fields
  const allowedFields = [
    "name", "email", "timeZone", "reportsTo", "empID", "role",
    "phoneNumber", "designation", "department", "branch", "empType", "joiningDate",
    "about", "salary", "education", "address", "experience", "DOB",
    "maritalStatus", "emergencyContact", "addedby", "empStatus", "avalaibleLeaves"
  ];

  allowedFields.forEach(field => {
    if (updates[field] !== undefined) {
      user[field] = updates[field];
    }
  });

  const updatedUser = await user.save();
  res.status(200).json(updatedUser);
});

// 5. Delete User
exports.deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Find user first to check if exists
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User not found");

  // Cleanup: Remove user from their department before deleting
  if (user.department) {
    await Department.findByIdAndUpdate(user.department, {
      $pull: { members: id }
    });
  }

  // Remove user from any manager's reportsTo relationships
  await User.updateMany(
    { reportsTo: id },
    { $set: { reportsTo: null } }
  );

  // Use findOneAndDelete to trigger the pre hook
  await User.findOneAndDelete({ _id: id });

  res.status(200).json({
    status: "success",
    message: "User deleted successfully"
  });
});

// --- ADMIN / UTILS ---

exports.getUserByRole = catchAsync(async (req, res) => {
  const { role } = req.params;
  const users = await User.find({ role });
  res.status(200).json(users);
});

exports.getDashboardCards = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('dashboardCards');
  if (!user) throw new NotFoundError("User");
  res.status(200).json(user.dashboardCards);
});

exports.addDashboardCard = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { type } = req.body;

  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User");

  if (user.dashboardCards.some(card => card.type === type)) {
    throw new BadRequestError("Card already exists");
  }

  user.dashboardCards.push({
    type,
    id: Date.now().toString()
  });

  await user.save();
  res.status(201).json(user.dashboardCards);
});

exports.removeDashboardCard = catchAsync(async (req, res) => {
  const { id, cardId } = req.params;
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User");

  const initialLength = user.dashboardCards.length;
  user.dashboardCards = user.dashboardCards.filter(card => card.id !== cardId);

  if (user.dashboardCards.length === initialLength) {
    throw new NotFoundError("Card not found");
  }

  await user.save();
  res.status(200).json(user.dashboardCards);
});

exports.getUserLeaves = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select('leaves');
  if (!user) throw new NotFoundError("User");
  res.status(200).json(user.leaves);
});

exports.updateUserLeaves = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { pto, sick } = req.body;

  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User");

  // Update PTO and Sick leaves if provided
  if (pto !== undefined) user.leaves.pto = pto;
  if (sick !== undefined) user.leaves.sick = sick;

  // Recalculate available leaves (Logic: Total Assigned - Booked)
  // Assuming 'avalaibleLeaves' tracks the REMAINING balance.
  // Ideally: Available = (PTO + Sick) - Booked.
  // However, based on schema default structure, we'll update the total potential first.

  // Let's assume avalaibleLeaves is meant to be the current run-time balance.
  // If we change the allocation, we should adjust propertly.
  // For now, let's just save the allocation.
  // User Schema has: leaves: { pto, sick }, avlaibleLeaves, bookedLeaves.

  // Simplest logic: Update the allocation.
  // Recalculate available leaves based on new total and existing booked.
  const totalAllocated = (user.leaves.pto || 0) + (user.leaves.sick || 0);
  user.avalaibleLeaves = totalAllocated - (user.bookedLeaves || 0);

  await user.save();
  res.status(200).json(user.leaves);
});

exports.getUpcomingBirthdays = catchAsync(async (req, res) => {
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const users = await User.aggregate([
    {
      $project: {
        name: 1,
        DOB: 1,
        avatar: 1,
        birthMonth: { $month: { $toDate: "$DOB" } },
        birthDay: { $dayOfMonth: { $toDate: "$DOB" } },
        daysUntilBirthday: {
          $let: {
            vars: {
              nextBirthday: {
                $dateFromParts: {
                  year: {
                    $cond: [
                      {
                        $and: [
                          { $gte: [{ $month: { $toDate: "$DOB" } }, currentMonth] },
                          { $gt: [{ $dayOfMonth: { $toDate: "$DOB" } }, currentDay] }
                        ]
                      },
                      today.getFullYear(),
                      today.getFullYear() + 1
                    ]
                  },
                  month: { $month: { $toDate: "$DOB" } },
                  day: { $dayOfMonth: { $toDate: "$DOB" } }
                }
              }
            },
            in: {
              $divide: [
                { $subtract: ["$$nextBirthday", today] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      }
    },
    { $match: { daysUntilBirthday: { $gte: 0, $lte: 30 } } },
    { $sort: { daysUntilBirthday: 1 } },
    { $limit: 3 }
  ]);

  const formattedBirthdays = users.map(user => {
    const birthDate = new Date(user.DOB);
    return {
      name: user.name,
      date: birthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      day: birthDate.toLocaleDateString('en-US', { weekday: 'long' }),
      avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
      color: `bg-blue-100 text-blue-700`
    };
  });

  res.status(200).json(formattedBirthdays);
});

exports.uploadAvatar = catchAsync(async (req, res) => {
  const { id } = req.params;
  if (!req.file) throw new BadRequestError('No file uploaded');

  const user = await User.findByIdAndUpdate(
    id,
    { avatar: req.file.path },
    { new: true }
  );

  if (!user) throw new NotFoundError("User");

  res.status(200).json({
    status: 'success',
    avatarUrl: user.avatar
  });
});

exports.getOrgChart = catchAsync(async (req, res, next) => {
  // 1. Fetch all active users with necessary fields
  const users = await User.find({ empStatus: "Active" })
    .select("name designation avatar role email phone reportsTo department")
    .populate("department", "name")
    .lean();

  // 2. Helper to build the tree recursively
  const buildTree = (users, managerId = null) => {
    return users
      .filter((user) => {
        // If managerId is null, we are looking for root nodes (CEO)
        // Check if reportsTo is null OR if reportsTo doesn't exist in our list (orphan handling)
        if (managerId === null) {
          return !user.reportsTo;
        }
        return user.reportsTo && user.reportsTo.toString() === managerId.toString();
      })
      .map((user) => ({
        ...user,
        // Recursively find children for this user
        children: buildTree(users, user._id)
      }));
  };

  // 3. Build the hierarchy starting from roots (users with no manager)
  const hierarchy = buildTree(users, null);

  res.status(200).json({
    status: "success",
    data: hierarchy
  });
});