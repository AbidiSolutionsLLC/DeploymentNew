/**
 * Central leave-quota policy.
 *
 * Default leave entitlement is derived from the employee's `empType`:
 *   - Intern      -> 0 days
 *   - Contractor  -> 3 days (sick leave only)
 *   - Permanent   -> 15 days (10 PTO + 5 sick)
 *
 * `user.leaves.pto` / `user.leaves.sick` hold the REMAINING balance, so when a
 * quota is (re)applied we subtract the days the employee has already taken
 * (every non-rejected `leaveHistory` entry) instead of overwriting them.
 *
 *   remaining = quota - used   (never below 0)
 */

const DEFAULT_LEAVE_QUOTA = Object.freeze({
  Intern: { pto: 0, sick: 0 },
  Contractor: { pto: 0, sick: 3 },
  Permanent: { pto: 10, sick: 5 },
  "Part Time": { pto: 10, sick: 5 },
});

const FALLBACK_EMP_TYPE = "Permanent";

const getDefaultLeaveQuota = (empType) =>
  DEFAULT_LEAVE_QUOTA[empType] || DEFAULT_LEAVE_QUOTA[FALLBACK_EMP_TYPE];

const calculateUsedLeaves = (leaveHistory = []) => {
  let usedPto = 0;
  let usedSick = 0;

  (Array.isArray(leaveHistory) ? leaveHistory : []).forEach((entry) => {
    if (!entry || entry.status === "Rejected") return;
    const days = Number(entry.daysTaken) || 0;
    if (entry.leaveType === "Sick") usedSick += days;
    else usedPto += days;
  });

  return { usedPto, usedSick };
};

/**
 * Mutates `user` so its leave balances match the quota for its `empType`,
 * while preserving every day already taken. Returns a summary of the result.
 */
const applyDefaultLeaveQuota = (user) => {
  if (!user) return null;

  const quota = getDefaultLeaveQuota(user.empType);
  const { usedPto, usedSick } = calculateUsedLeaves(user.leaveHistory);

  const pto = Math.max(0, quota.pto - usedPto);
  const sick = Math.max(0, quota.sick - usedSick);

  if (!user.leaves) user.leaves = {};
  user.leaves.pto = pto;
  user.leaves.sick = sick;
  user.bookedLeaves = usedPto + usedSick;
  user.avalaibleLeaves = pto + sick;

  return { quota, usedPto, usedSick, pto, sick };
};

module.exports = {
  DEFAULT_LEAVE_QUOTA,
  FALLBACK_EMP_TYPE,
  getDefaultLeaveQuota,
  calculateUsedLeaves,
  applyDefaultLeaveQuota,
};
