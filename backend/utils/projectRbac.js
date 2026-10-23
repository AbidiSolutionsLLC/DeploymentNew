/**
 * Project Portal RBAC Utility
 * Resolves effective project roles and access privileges,
 * keeping People Portal roles completely independent.
 *
 * Standard Project Roles:
 * - 'project_administrator': Enterprise/portfolio administration (formerly Super Admin / Admin in portal context)
 * - 'project_manager': Project delivery and task oversight (formerly Manager in portal context)
 * - 'team_member': Task execution and contributor collaboration (formerly Employee in portal context)
 */

const ROLE_PROJECT_ADMINISTRATOR = 'project_administrator';
const ROLE_PROJECT_MANAGER = 'project_manager';
const ROLE_TEAM_MEMBER = 'team_member';

function normalizeProjectRole(rawRole) {
  if (!rawRole) return null;
  const cleaned = String(rawRole).toLowerCase().replace(/[\s_-]+/g, '');
  if (
    cleaned === 'projectadministrator' ||
    cleaned === 'projectadmin' ||
    cleaned === 'superadmin' ||
    cleaned === 'admin'
  ) {
    return ROLE_PROJECT_ADMINISTRATOR;
  }
  if (cleaned === 'projectmanager' || cleaned === 'manager') {
    return ROLE_PROJECT_MANAGER;
  }
  if (
    cleaned === 'teammember' ||
    cleaned === 'member' ||
    cleaned === 'contributor' ||
    cleaned === 'employee' ||
    cleaned === 'hr' ||
    cleaned === 'technician'
  ) {
    return ROLE_TEAM_MEMBER;
  }
  return ROLE_TEAM_MEMBER;
}

function getEffectiveProjectRole(user) {
  if (!user) return null;

  // 1. Explicit Project Portal role takes top precedence inside the Project Portal
  if (user.projectRole) {
    return normalizeProjectRole(user.projectRole);
  }

  // 2. Company-wide Super Admin & Admin default to Project Administrator privileges
  const companyRole = (user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (companyRole === 'superadmin' || companyRole === 'admin') {
    return ROLE_PROJECT_ADMINISTRATOR;
  }

  // 3. Fallback: normalize company role (e.g. Employee, HR -> team_member)
  return normalizeProjectRole(companyRole) || ROLE_TEAM_MEMBER;
}

function hasProjectPortalAccess(user) {
  if (!user) return false;
  const companyRole = (user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
  if (companyRole === 'superadmin' || companyRole === 'admin') return true;
  return Boolean(user.hasProjectPortalAccess || user.projectRole);
}

function formatDisplayProjectRole(rawRole) {
  const norm = normalizeProjectRole(rawRole);
  if (norm === ROLE_PROJECT_ADMINISTRATOR) return 'Project Administrator';
  if (norm === ROLE_PROJECT_MANAGER) return 'Project Manager';
  if (norm === ROLE_TEAM_MEMBER) return 'Team Member';
  return 'Team Member';
}

module.exports = {
  ROLE_PROJECT_ADMINISTRATOR,
  ROLE_PROJECT_MANAGER,
  ROLE_TEAM_MEMBER,
  normalizeProjectRole,
  getEffectiveProjectRole,
  hasProjectPortalAccess,
  formatDisplayProjectRole,
};
