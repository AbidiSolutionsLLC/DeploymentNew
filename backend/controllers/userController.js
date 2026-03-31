const User = require("../models/userSchema");
const Department = require("../models/departemt");
const catchAsync = require("../utils/catchAsync");
const { BadRequestError, NotFoundError, ForbiddenError } = require("../utils/ExpressError");
const sendEmail = require('../utils/emailService');
const { getSearchScope } = require("../utils/rbac");
const { createNotification } = require('../utils/notificationService');

// --- HELPER: Check Write Permissions ---
const checkWritePermission = async (actor, targetUserId = null, targetRole = null) => {
  if (!actor) return false;
  const actorId = actor._id || actor.id;

  if (actor.role === 'Super Admin') return true;

  if (targetUserId && String(actorId) === String(targetUserId)) {
    return "SELF_EDIT";
  }

  const isManagerTech = actor.role === 'Manager' && actor.isTechnician === true;

  if (actor.role === 'Admin' || isManagerTech) {
    const restrictedRoles = ['Super Admin', 'Admin'];
    if (targetRole && restrictedRoles.includes(targetRole)) {
      throw new ForbiddenError("You cannot assign or manage Admin or Super Admin roles.");
    }

    if (targetUserId) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) throw new NotFoundError("User not found");
      if (restrictedRoles.includes(targetUser.role)) {
        throw new ForbiddenError("Permission Denied: You cannot modify Admins or Super Admins.");
      }
    }
    return true;
  }

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

// --- INITIAL SUPER ADMIN SETUP ---
exports.createInitialSuperAdmin = catchAsync(async (req, res) => {
  // Check if any Super Admin already exists
  const superAdminExists = await User.findOne({ role: 'Super Admin' });
  if (superAdminExists) {
    throw new ForbiddenError("A Super Admin already exists. This setup route is disabled.");
  }

  let { email, name, ...otherData } = req.body;

  if (!email || !name) {
    throw new BadRequestError("Email and Name are required for setup.");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new BadRequestError("User with this email already exists.");

  const newEmpID = await generateEmpID();
  const defaultCards = [
    { type: 'todo', id: Date.now().toString() + '-1' },
    { type: 'holidays', id: Date.now().toString() + '-2' },
    { type: 'leavelog', id: Date.now().toString() + '-3' }
  ];

  const newUser = new User({
    email,
    name,
    ...otherData,
    role: "Super Admin", // Force Super Admin role
    empID: newEmpID,
    dashboardCards: defaultCards,
    empStatus: "Active", // Auto-activate the first admin
    isTechnician: false
  });

  const savedUser = await newUser.save();

  res.status(201).json({ 
    status: "success", 
    message: "Initial Super Admin created successfully.", 
    data: {
      id: savedUser._id,
      email: savedUser.email,
      name: savedUser.name,
      role: savedUser.role
    } 
  });
});

// --- SECURED CREATE USER ---
exports.createUser = catchAsync(async (req, res) => {
  // Extract hourlyWage from body
  let { email, hourlyWage, ...otherData } = req.body;
  
  await checkWritePermission(req.user, null, otherData.role);

  if (otherData.reportsTo === "NO MANAGER (TOP LEVEL)" || otherData.reportsTo === "") otherData.reportsTo = null;

  if (req.user?.role === 'Admin' && (!otherData.reportsTo || otherData.reportsTo !== req.user.id)) {
     otherData.reportsTo = req.user.id;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new BadRequestError("User with this email already exists");

  const newEmpID = await generateEmpID();
  const defaultCards = [
    { type: 'todo', id: Date.now().toString() + '-1' },
    { type: 'holidays', id: Date.now().toString() + '-2' },
    { type: 'leavelog', id: Date.now().toString() + '-3' }
  ];

  const newUser = new User({
    email,
    ...otherData,
    hourlyWage: Number(hourlyWage) || 0, // Ensure numeric format
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

  // In-app notification: notify all admins / super admins
  try {
    const admins = await User.find({
      $or: [{ role: 'Super Admin' }, { role: 'Admin' }]
    }).select('_id');
    const notifPromises = admins.map(admin =>
      createNotification({
        recipient: admin._id,
        type: 'USER_CREATED',
        title: 'New User Added',
        message: `A new user "${savedUser.name}" (${savedUser.email}) has been added to the system.`,
        relatedEntity: { entityType: 'user', entityId: savedUser._id },
      })
    );
    await Promise.all(notifPromises);
  } catch (notifErr) {
    console.error('[Notification] User created:', notifErr.message);
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

// --- SECURED UPDATE USER (With Wage Protection) ---
exports.updateUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const permission = await checkWritePermission(req.user, id, req.body.role);

  const user = await User.findById(id);
  if (!user) throw new NotFoundError("User not found");

  const updates = { ...req.body };
  let allowedFields = [];

  if (permission === "SELF_EDIT") {
      // --- RESTRICTED FIELDS FOR SELF-EDIT (Wage protected) ---
      const sensitiveFields = [
          "role", "salary", "hourlyWage", "department", "reportsTo", 
          "designation", "email", "empID", "empStatus", 
          "joiningDate", "empType", "avalaibleLeaves", "bookedLeaves", "isTechnician"
      ];
      
      sensitiveFields.forEach(field => delete updates[field]);

      allowedFields = [
          "name", "phoneNumber", "about", "education", 
          "address", "experience", "DOB", "maritalStatus", 
          "emergencyContact", "timeZone"
      ];
  } else {
      // --- SUPER_ADMIN / ADMIN / MANAGER_TECH EDIT ---
      if (updates.department && updates.department !== user.department?.toString()) {
        const oldDeptId = user.department;
        const newDeptId = updates.department;
        if (oldDeptId) await Department.findByIdAndUpdate(oldDeptId, { $pull: { members: id } });
        if (newDeptId) {
          const dept = await Department.findByIdAndUpdate(newDeptId, { $push: { members: id } });
          if (dept) {
            createNotification({
              recipient: id,
              type: 'DEPARTMENT_MEMBER_ADDED',
              title: 'Department Assignment',
              message: `You have been added to the ${dept.name} department.`,
              relatedEntity: { entityType: 'department', entityId: dept._id },
            }).catch(console.error);
          }
        }
      }
      
      if (updates.reportsTo === "" || updates.reportsTo === "NO MANAGER") updates.reportsTo = null;

      // Admins/Managers can edit all profile fields including hourlyWage
      allowedFields = [
          "name", "email", "timeZone", "reportsTo", "empID", "role", "phoneNumber", 
          "designation", "department", "branch", "empType", "joiningDate", "endDate", "about", 
          "salary", "hourlyWage", "education", "address", "experience", "DOB", "maritalStatus", 
          "emergencyContact", "addedby", "empStatus", "avalaibleLeaves", "isTechnician"
      ];
  }

  // Apply Updates
  Object.keys(updates).forEach(field => { 
      if (allowedFields.includes(field) && updates[field] !== undefined) {
          // Explicitly cast hourlyWage to number
          user[field] = field === 'hourlyWage' ? Number(updates[field]) : updates[field]; 
      }
  });

  const updatedUser = await user.save();

  // In-app notification: notify admins if a user was deactivated
  if (updates.empStatus === 'Inactive' && user.empStatus !== 'Inactive') {
    try {
      const admins = await User.find({
        $or: [{ role: 'Super Admin' }, { role: 'Admin' }],
        _id: { $ne: updatedUser._id }
      }).select('_id');
      const notifPromises = admins.map(admin =>
        createNotification({
          recipient: admin._id,
          type: 'USER_DEACTIVATED',
          title: 'User Deactivated',
          message: `User "${updatedUser.name}" has been deactivated.`,
          relatedEntity: { entityType: 'user', entityId: updatedUser._id },
        })
      );
      await Promise.all(notifPromises);
    } catch (notifErr) {
      console.error('[Notification] User deactivated:', notifErr.message);
    }
  }

  res.status(200).json(updatedUser);
});

// --- SECURED DELETE USER ---
exports.deleteUser = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const permission = await checkWritePermission(req.user, id);

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
  
  const permission = await checkWritePermission(req.user, id);
  if (!permission) throw new ForbiddenError("Permission denied");

  if (!req.file) throw new BadRequestError('No file uploaded');
  const fileUrl = getFileUrl(req);
  const user = await User.findByIdAndUpdate(id, { coverImage: fileUrl }, { new: true });
  if (!user) throw new NotFoundError("User not found");
  res.status(200).json({ status: 'success', coverUrl: user.coverImage });
});