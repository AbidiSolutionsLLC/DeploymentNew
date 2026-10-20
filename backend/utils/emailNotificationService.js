const User = require("../models/userSchema");
const { sendEmail } = require("../config/emailConfig");

/**
 * ============================================================================
 *  EMAIL NOTIFICATION SERVICE
 * ============================================================================
 *  Single gateway for every *notification style* email (leave, ticket,
 *  expense, timesheet, payroll).
 *
 *  Transactional / security emails (OTP, password reset, invitations) must NOT
 *  go through this service - they are not user-mutable notification prefs.
 *
 *  Responsibilities:
 *   1. Resolve the recipient User and read their `notificationPreferences.email`.
 *   2. Respect the master `enabled` switch and the per-category switch.
 *   3. Enforce the RBAC audience - only roles that genuinely receive a given
 *      category can be emailed for it (see EMAIL_NOTIFICATION_MATRIX).
 *   4. Never throw - notification failures must never break a business action.
 * ============================================================================
 */

/**
 * Preference category for each in-app notification type.
 * Only categories that actually send an email are listed here.
 */
const EMAIL_CATEGORY_BY_NOTIFICATION_TYPE = {
  LEAVE_APPROVED: "leaveUpdates",
  LEAVE_REJECTED: "leaveUpdates",
  LEAVE_REQUEST_SUBMITTED: "leaveUpdates",
  TICKET_CREATED: "ticketUpdates",
  TICKET_ASSIGNED: "ticketUpdates",
  TICKET_RESPONSE_ADDED: "ticketUpdates",
  TICKET_STATUS_CHANGED: "ticketUpdates",
  TICKET_CLOSED: "ticketUpdates",
  EXPENSE_SUBMITTED: "expenseUpdates",
  EXPENSE_APPROVED: "expenseUpdates",
  EXPENSE_REJECTED: "expenseUpdates",
  TIMESHEET_SUBMITTED: "timesheetUpdates",
  TIMESHEET_APPROVED: "timesheetUpdates",
  TIMESHEET_REJECTED: "timesheetUpdates",
};

/**
 * Single source of truth for "which type of user receives which type of
 * notification" (email). `audience` lists the roles that genuinely receive a
 * category; `technicianOnlyRoles` lists roles that only receive it when they
 * also have the technician flag.
 *
 * Derived from the actual recipient resolution in the services:
 *  - leave/timesheet : Super Admin, Admin, HR + the submitter's manager  (submission)
 *                      and the requester themself                   (status/response)
 *  - expense         : submitter's manager + Admin + Super Admin     (submission)
 *                      and the submitter themself                  (status)
 *  - ticket          : requester + Super Admin/Admin + technician-manager (created)
 *                      and the assignee                           (assigned)
 *  - payroll         : Super Admin only
 *
 * Task / project / account notifications are in-app only and have no emails,
 * so they are intentionally NOT part of this matrix (users get no toggle).
 */
const EMAIL_NOTIFICATION_MATRIX = {
  leaveUpdates: {
    label: "Leave updates",
    description: "Leave requests, approvals and rejections.",
    audience: ["Super Admin", "Admin", "HR", "Manager", "Employee", "Technician"],
    technicianOnlyRoles: [],
  },
  timesheetUpdates: {
    label: "Timesheet updates",
    description: "Timesheet submissions, approvals and rejections.",
    audience: ["Super Admin", "Admin", "HR", "Manager", "Employee", "Technician"],
    technicianOnlyRoles: [],
  },
  expenseUpdates: {
    label: "Expense updates",
    description: "Expense submissions, approvals and rejections.",
    audience: ["Super Admin", "Admin", "HR", "Manager", "Employee", "Technician"],
    technicianOnlyRoles: [],
  },
  ticketUpdates: {
    label: "Ticket updates",
    description: "Support tickets you raise or are assigned.",
    audience: ["Super Admin", "Admin", "Employee", "Technician"],
    // A Manager only receives ticket emails when also flagged as a technician.
    technicianOnlyRoles: ["Manager"],
  },
  payrollUpdates: {
    label: "Payroll updates",
    description: "Payroll runs and payslip generation.",
    audience: ["Super Admin"],
    technicianOnlyRoles: [],
  },
};

const DEFAULT_EMAIL_PREFS = {
  enabled: true,
  leaveUpdates: true,
  ticketUpdates: true,
  expenseUpdates: true,
  timesheetUpdates: true,
  payrollUpdates: true,
};

/**
 * Resolves the email preference object for a user, applying safe defaults so
 * that legacy/partial records never disable notifications unexpectedly.
 */
function resolveEmailPrefs(user) {
  const prefs = (user && user.notificationPreferences && user.notificationPreferences.email) || {};
  const merged = { ...DEFAULT_EMAIL_PREFS };
  Object.keys(DEFAULT_EMAIL_PREFS).forEach((key) => {
    if (typeof prefs[key] === "boolean") merged[key] = prefs[key];
  });
  // Backwards compatibility: legacy `leaveApprovals` maps to `leaveUpdates`.
  if (typeof prefs.leaveApprovals === "boolean" && typeof prefs.leaveUpdates !== "boolean") {
    merged.leaveUpdates = prefs.leaveApprovals;
  }
  return merged;
}

/**
 * RBAC check: is this user's role eligible to receive this category at all?
 * Unknown categories and unknown roles are treated as eligible (fail-open)
 * so we never silently drop mail we cannot reason about.
 */
function isRoleEligibleForCategory(user, category) {
  const matrix = category ? EMAIL_NOTIFICATION_MATRIX[category] : null;
  if (!matrix) return true;
  if (!user || !user.role) return true;

  const role = user.role;
  const isTechnician = user.isTechnician === true;
  if (matrix.audience.includes(role)) return true;
  if ((matrix.technicianOnlyRoles || []).includes(role) && isTechnician) return true;
  return false;
}

/**
 * The list of email categories a given user *can* receive, i.e. the toggles
 * that are actually meaningful for their role.
 * @returns {Array<{key:string,label:string,description:string}>}
 */
function getEmailCategoriesForUser(user) {
  return Object.keys(EMAIL_NOTIFICATION_MATRIX)
    .filter((key) => isRoleEligibleForCategory(user, key))
    .map((key) => ({
      key,
      label: EMAIL_NOTIFICATION_MATRIX[key].label,
      description: EMAIL_NOTIFICATION_MATRIX[key].description,
    }));
}

/**
 * Synchronous check used before sending an email.
 * Combines the RBAC audience with the user's preference switches.
 * @param {Object} user      Mongoose User doc / plain object (may be null).
 * @param {string} category  Preference category key.
 */
function isEmailAllowed(user, category) {
  if (!user) return true; // Cannot determine -> do not silently drop.
  const prefs = resolveEmailPrefs(user);
  if (prefs.enabled === false) return false;
  if (category && typeof prefs[category] === "boolean" && prefs[category] === false) return false;
  if (!isRoleEligibleForCategory(user, category)) return false;
  return true;
}

/**
 * Central sender for notification emails.
 *
 * @param {Object}               params
 * @param {Object|string}        [params.recipient]      User doc, or User _id.
 * @param {string}               [params.recipientEmail] Email if no recipient object is available.
 * @param {string}               params.category         Preference category key.
 * @param {string}               params.subject
 * @param {string}               params.htmlContent
 * @param {string|ObjectId}      [params.companyId]
 * @param {string}               [params.notificationType] Optional notification type enum used to derive category.
 * @returns {Promise<{sent:boolean, skipped?:boolean, reason?:string}|null>}
 */
async function sendNotificationEmail({
  recipient,
  recipientEmail,
  category,
  subject,
  htmlContent,
  companyId,
  notificationType,
}) {
  try {
    const resolvedCategory =
      category || EMAIL_CATEGORY_BY_NOTIFICATION_TYPE[notificationType] || null;

    let user = recipient;

    // Only skip the DB round-trip when we truly have a profile-like object.
    // A raw ObjectId (or anything without profile fields) must be resolved by id,
    // and if no id is present we fall back to the recipient email - never to an
    // empty query (which Mongoose would resolve to an arbitrary document).
    const carriesProfile =
      user && typeof user === "object" && (user.email || user.role || user.notificationPreferences);

    if (!carriesProfile) {
      const idValue =
        typeof user === "string"
          ? user
          : user && typeof user === "object"
            ? user._id || user.id
            : null;
      const query = idValue ? { _id: idValue } : recipientEmail ? { email: recipientEmail } : null;
      user = query
        ? await User.findOne(query).select("email role isTechnician notificationPreferences").lean()
        : null;
    }

    const email = recipientEmail || (user && user.email);
    if (!email) return { sent: false, skipped: true, reason: "no-email" };

    if (!isEmailAllowed(user, resolvedCategory)) {
      return { sent: false, skipped: true, reason: "preference-disabled" };
    }

    await sendEmail({ to: email, subject, htmlContent, companyId });
    return { sent: true };
  } catch (err) {
    console.error("[EmailNotification] Failed to send notification email:", err.message);
    return null;
  }
}

module.exports = {
  sendNotificationEmail,
  isEmailAllowed,
  isRoleEligibleForCategory,
  getEmailCategoriesForUser,
  resolveEmailPrefs,
  EMAIL_CATEGORY_BY_NOTIFICATION_TYPE,
  EMAIL_NOTIFICATION_MATRIX,
  DEFAULT_EMAIL_PREFS,
};
