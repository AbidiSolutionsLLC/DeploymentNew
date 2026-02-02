const User = require("../models/userSchema");
const Department = require("../models/departemt");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const sendEmail = require('../utils/emailService');
const { getSearchScope } = require("../utils/rbac");

// --- HELPER: Check Write Permissions (FIXED 500 ERROR) ---
const checkWritePermission = async (actor, targetUserId = null, targetRole = null) => {
  // Safety Check: Ensure actor exists
  if (!actor) return false;

  // Normalize Actor ID (Handle both _id and id to prevent crashes)
  const actorId = actor._id || actor.id;

  // 1. Super Admin has Global Write Access
  if (actor.role === 'Super Admin') return true;

  // 2. SELF-EDIT CHECK (FIXED)
  // Using String() is safer than .toString() because it handles null/undefined without crashing
  if (targetUserId && String(actorId) === String(targetUserId)) {
    return "SELF_EDIT";
  }

  // 3. Manager + Technician Logic
  // Allows Managers who are Technicians to manage users
  const isManagerTech = actor.role === 'Manager' && actor.isTechnician === true;

  // 4. Admin Logic (Scoped Write Access)
  if (actor.role === 'Admin' || isManagerTech) {
    // Restricted Roles that an Admin/ManagerTech cannot touch or create
    const restrictedRoles = ['Super Admin', 'Admin'];

    // Cannot create/assign a user to a restricted role
    if (targetRole && restrictedRoles.includes(targetRole)) {
      throw new ForbiddenError("You cannot assign or manage Admin or Super Admin roles.");
    }

    // If Editing/Deleting an existing user:
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) throw new NotFoundError("User not found");

      // Block editing/deleting of Admins and Super Admins
      if (restrictedRoles.includes(targetUser.role)) {
        throw new ForbiddenError("Permission Denied: You cannot modify Admins or Super Admins.");
      }
    }
    return true;
  }

  // 5. Standard HR, Managers, Technicians, Employees have NO Write Access (to others)
  if (['HR', 'Manager', 'Technician', 'Employee'].includes(actor.role)) {
    throw new ForbiddenError("You do not have permission to manage users.");
  }

  return false;
};

const generateEmpID = async () => {
  const lastUser = await User.findOne({}, { empID: 1 }).sort({ createdAt: -1 });
  if (!lastUser || !lastUser.empID || !lastUser.empID.startsWith("EMP-")) return "EMP-001";
  const lastIdStr = lastUser.empID.split("-")[1];
  const lastIdNum = parseInt(lastIdStr, 10);
  return isNaN(lastIdNum) ? "EMP-001" : `EMP-${String(lastIdNum + 1).padStart(3, "0")}`;
};

const getFileUrl = (req) => {
  if (!req.file) return null;
  if (req.file.url) return req.file.url; 
  if (req.file.location) return req.file.location; 
  let cleanPath = req.file.path.replace(/\\/g, "/");
  cleanPath = cleanPath.replace(/^public\//, "");
  return `${req.protocol}://${req.get('host')}/${cleanPath}`;
};

const sendInviteEmail = async (user) => {
  const frontendLoginUrl = "https://abidipro.abidisolutions.com/auth/login";
  const emailSubject = "You're Invited! Join the Abidi Solutions Portal";
  const emailBody = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background-color: #497a71; padding: 25px; text-align: center;">
        <h1 style="color: #fff; margin: 0;">Welcome Aboard!</h1>
      </div>
      <div style="padding: 30px;">
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>You have been invited to join the <strong>Abidi Solutions Employee Portal</strong>.</p>
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #497a71; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role}</p>
          <p style="margin: 5px 0;"><strong>Username:</strong> ${user.email}</p>
          <p style="margin: 5px 0; color: #e67e22;"><strong>Status:</strong> Pending Activation</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${frontendLoginUrl}" style="background-color: #497a71; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Accept Invitation & Login
          </a>
        </div>
        <p style="font-size: 13px; color: #666;">Please sign in using your Microsoft Account to activate your profile.</p>
      </div>
    </div>
  `;
  await sendEmail(user.email, emailSubject, emailBody);
};

// --- SECURED CREATE USER ---
exports.createUser = catchAsync(async (req, res) => {
  let { email, ...otherData } = req.body;
  
  await checkWritePermission(req.user, null, otherData.role);

  if (otherData.reportsTo === "NO MANAGER (TOP LEVEL)" || otherData.reportsTo === "") otherData.reportsTo = null;

  if (req.user.role === 'Admin' && (!otherData.reportsTo || otherData.reportsTo !== req.user.id)) {
     otherData.reportsTo = req.user.id;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new BadRequestError("User with this email already exists");

  const newEmpID = await generateEmpID();
  const defaultCards = [
    { type: 'todo', id: Date.now().toString() + '-1' },
    { type: 'feeds', id: Date.now().toString() + '-2' },
    { type: 'leavelog', id: Date.now().toString() + '-3' }
  ];

  const newUser = new User({
    email,
    ...otherData,
    empID: newEmpID,
    dashboardCards: defaultCards,
    empStatus: "Pending",
    isTechnician: otherData.isTechnician || false
  });

  const savedUser = await newUser.save();
  if (otherData.department) await Department.findByIdAndUpdate(otherData.department, { $push: { members: savedUser._id } });

  try {
    await sendInviteEmail(savedUser);
  } catch (err) {
    console.error("❌ Failed to send invite email:", err.message);
  }

  res.status(201).json({ status: "success", message: "User invited successfully.", data: savedUser });
});

exports.resendInvitation = catchAsync(async (req, res) => {
  await checkWritePermission(req.user, req.params.id);

  const user = await User.findById(req.params.id);
  if (!user) throw new NotFoundError("User not found");
  if (user.empStatus !== "Pending" && user.empStatus !== "Inactive") throw new BadRequestError("User already active.");
  
  try {
    await sendInviteEmail(user);
    res.status(200).json({ status: "success", message: `Invitation resent to ${user.email}` });
  } catch (error) {
    throw new BadRequestError("Failed to send email: " + error.message);
  }
});

exports.getAllUsers = catchAsync(async (req, res) => {
  const { status } = req.query;
  const rbacFilter = await getSearchScope(req.user, 'usermanagement'); 

  const query = { ...rbacFilter };
  if (status) query.empStatus = status;

  const users = await User.find(query)
    .populate("department", "name")
    .populate("reportsTo", "name designation");

  res.status(200).json(users);
});

exports.getUserById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id)
    .populate({ path: "department", populate: { path: "members", model: "User", select: "name email designation avatar role empStatus" } })
    .populate({ path: "reportsTo", select: "name email designation avatar role" });
  if (!user) throw new NotFoundError("User not found");
  res.status(200).json(user);
});

// --- SECURED UPDATE USER (FIXED SELF-EDIT) ---
exports.updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // 1. Check Permission (Returns "SELF_EDIT" or true/false)
  const permission = await checkWritePermission(req.user, id, req.body.role);

  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User not found");

  const updates = { ...req.body };
  let allowedFields = [];

  // 2. Handle Self-Edit vs Admin Edit
  if (permission === "SELF_EDIT") {
      // --- RESTRICTED FIELDS FOR SELF-EDIT ---
      // User CANNOT change these fields
      const sensitiveFields = [
          "role", "salary", "department", "reportsTo", 
          "designation", "email", "empID", "empStatus", 
          "joiningDate", "empType", "avalaibleLeaves", "bookedLeaves", "isTechnician"
      ];
      
      // Remove sensitive fields from the update object
      sensitiveFields.forEach(field => delete updates[field]);

      // Allow these specific fields
      allowedFields = [
          "name", "phoneNumber", "about", "education", 
          "address", "experience", "DOB", "maritalStatus", 
          "emergencyContact", "timeZone"
      ];
  } else {
      // --- ADMIN / MANAGER_TECH EDIT ---
      // Logic for Department Changes
      if (updates.department && updates.department !== user.department?.toString()) {
        const oldDeptId = user.department;
        const newDeptId = updates.department;
        if (oldDeptId) await Department.findByIdAndUpdate(oldDeptId, { $pull: { members: id } });
        if (newDeptId) await Department.findByIdAndUpdate(newDeptId, { $push: { members: id } });
      }
      
      if (updates.reportsTo === "" || updates.reportsTo === "NO MANAGER") updates.reportsTo = null;

      // Admins/Managers can edit all profile fields
      allowedFields = [
          "name", "email", "timeZone", "reportsTo", "empID", "role", "phoneNumber", 
          "designation", "department", "branch", "empType", "joiningDate", "about", 
          "salary", "education", "address", "experience", "DOB", "maritalStatus", 
          "emergencyContact", "addedby", "empStatus", "avalaibleLeaves", "isTechnician"
      ];
  }

  // 3. Apply Updates
  Object.keys(updates).forEach(field => { 
      if (allowedFields.includes(field) && updates[field] !== undefined) {
          user[field] = updates[field]; 
      }
  });

  const updatedUser = await user.save();
  res.status(200).json(updatedUser);
});

// --- SECURED DELETE USER ---
exports.deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check permission
  const permission = await checkWritePermission(req.user, id);

  // Safety: Prevent users from deleting themselves (even if Self-Edit is allowed)
  if (permission === "SELF_EDIT") {
      throw new ForbiddenError("You cannot delete your own account.");
  }

  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User not found");
  if (user.department) await Department.findByIdAndUpdate(user.department, { $pull: { members: id } });
  await User.updateMany({ reportsTo: id }, { $set: { reportsTo: null } });
  await User.findOneAndDelete({ _id: id });
  res.status(200).json({ status: "success", message: "User deleted successfully" });
});

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
  if (user.dashboardCards.some(card => card.type === type)) throw new BadRequestError("Card already exists");
  user.dashboardCards.push({ type, id: Date.now().toString() });
  await user.save();
  res.status(201).json(user.dashboardCards);
});

exports.removeDashboardCard = catchAsync(async (req, res) => {
  const { id, cardId } = req.params;
  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User");
  const initialLength = user.dashboardCards.length;
  user.dashboardCards = user.dashboardCards.filter(card => card.id !== cardId);
  if (user.dashboardCards.length === initialLength) throw new NotFoundError("Card not found");
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

  const role = req.user.role;

  if (role === 'Super Admin' || role === 'HR') {
    // Allowed
  } 
  else if (role === 'Admin' || role === 'Manager') {
    const isSubordinate = 
      (user.reportsTo && user.reportsTo.toString() === req.user.id) ||
      (user.reportingManager && user.reportingManager.toString() === req.user.id);
      
    if (!isSubordinate) {
      throw new ForbiddenError("You can only update leaves for your direct subordinates.");
    }
  } 
  else {
    throw new ForbiddenError("Permission denied.");
  }

  if (pto !== undefined) user.leaves.pto = pto;
  if (sick !== undefined) user.leaves.sick = sick;
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
    { $project: { name: 1, DOB: 1, avatar: 1, birthMonth: { $month: { $toDate: "$DOB" } }, birthDay: { $dayOfMonth: { $toDate: "$DOB" } }, daysUntilBirthday: { $let: { vars: { nextBirthday: { $dateFromParts: { year: { $cond: [{ $and: [{ $gte: [{ $month: { $toDate: "$DOB" } }, currentMonth] }, { $gt: [{ $dayOfMonth: { $toDate: "$DOB" } }, currentDay] }] }, today.getFullYear(), today.getFullYear() + 1] }, month: { $month: { $toDate: "$DOB" } }, day: { $dayOfMonth: { $toDate: "$DOB" } } } } }, in: { $divide: [{ $subtract: ["$$nextBirthday", today] }, 1000 * 60 * 60 * 24] } } } } },
    { $match: { daysUntilBirthday: { $gte: 0, $lte: 30 } } },
    { $sort: { daysUntilBirthday: 1 } },
    { $limit: 3 }
  ]);
  const formattedBirthdays = users.map(user => {
    const birthDate = new Date(user.DOB);
    return { name: user.name, date: birthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), day: birthDate.toLocaleDateString('en-US', { weekday: 'long' }), avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`, color: `bg-blue-100 text-blue-700` };
  });
  res.status(200).json(formattedBirthdays);
});

exports.uploadAvatar = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Security Check: Ensure user is editing their own avatar OR is an Admin/ManagerTech
  const permission = await checkWritePermission(req.user, id);
  if (!permission) throw new ForbiddenError("Permission denied");

  if (!req.file) throw new BadRequestError('No file uploaded');
  const fileUrl = getFileUrl(req);
  const user = await User.findByIdAndUpdate(id, { avatar: fileUrl }, { new: true });
  if (!user) throw new NotFoundError("User");
  res.status(200).json({ status: 'success', avatarUrl: user.avatar });
});

exports.getOrgChart = catchAsync(async (req, res) => {
  const users = await User.find({ empStatus: "Active" }).select("name designation avatar role email phone reportsTo department").populate("department", "name").lean();
  const buildTree = (users, managerId = null) => {
    return users.filter((user) => { if (managerId === null) return !user.reportsTo; return user.reportsTo && user.reportsTo.toString() === managerId.toString(); }).map((user) => ({ ...user, children: buildTree(users, user._id) }));
  };
  const hierarchy = buildTree(users, null);
  res.status(200).json({ status: "success", data: hierarchy });
});

exports.uploadCover = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Security Check
  const permission = await checkWritePermission(req.user, id);
  if (!permission) throw new ForbiddenError("Permission denied");

  if (!req.file) throw new BadRequestError('No file uploaded');
  const fileUrl = getFileUrl(req);
  const user = await User.findByIdAndUpdate(id, { coverImage: fileUrl }, { new: true });
  if (!user) throw new NotFoundError("User not found");
  res.status(200).json({ status: 'success', coverUrl: user.coverImage });
});
