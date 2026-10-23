import { useSelector } from 'react-redux';
import PERMISSIONS from '../constants/permissions';

function normalizeProjectRole(rawRole) {
  if (!rawRole) return null;
  const cleaned = String(rawRole).toLowerCase().replace(/[\s_-]+/g, '');
  if (
    cleaned === 'projectadministrator' ||
    cleaned === 'projectadmin' ||
    cleaned === 'superadmin' ||
    cleaned === 'admin'
  ) {
    return 'project_administrator';
  }
  if (cleaned === 'projectmanager' || cleaned === 'manager') {
    return 'project_manager';
  }
  return 'team_member';
}

function formatDisplayProjectRole(rawRole) {
  const norm = normalizeProjectRole(rawRole);
  if (norm === 'project_administrator') return 'Project Administrator';
  if (norm === 'project_manager') return 'Project Manager';
  return 'Team Member';
}

export function usePermission() {
  const authStateUser = useSelector((state) => state.auth?.user);
  const user = authStateUser?.user || authStateUser?.data?.user || authStateUser || null;

  const getEffectiveProjectRole = () => {
    if (!user) return null;
    if (user.projectRole) {
      return normalizeProjectRole(user.projectRole);
    }
    const r = (user.role || '').toLowerCase().replace(/[\s_-]+/g, '');
    if (r === 'superadmin' || r === 'admin') return 'project_administrator';
    return normalizeProjectRole(r) || 'team_member';
  };

  const projectRole = getEffectiveProjectRole();
  const projectRoleDisplay = formatDisplayProjectRole(user?.projectRole || user?.role);
  const isProjectAdmin = projectRole === 'project_administrator';
  const isProjectSuperAdmin = isProjectAdmin;
  const isProjectManager = projectRole === 'project_manager';
  const isTeamMember = projectRole === 'team_member';
  const isProjectEmployee = isTeamMember;

  const hasPermission = (permission) => {
    if (!user) return false;

    // Custom rule for ticketing assignment if user is a technician
    if (permission === 'tickets:assign' && user.isTechnician === true) {
      return true;
    }
    
    // Custom rule for manager reading team tickets if they are a technician
    if (permission === 'tickets:read:team' && user.isTechnician === true && user.role?.replace(/\s+/g, '').toLowerCase() === 'manager') {
      return true;
    }

    // Custom rule for project portal access
    if (permission === 'projects:access') {
      const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
      if (userRole === 'superadmin' || userRole === 'admin') return true;
      return Boolean(user.hasProjectPortalAccess || user.projectRole);
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;

    if (allowedRoles.includes('*')) return true;

    // For project portal specific permissions, check against the user's effective projectRole
    if (
      permission.startsWith('projects:') ||
      permission.startsWith('tasks:') ||
      permission.startsWith('project_groups:')
    ) {
      return allowedRoles.includes(projectRole);
    }

    const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    return allowedRoles.includes(userRole);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    const normalizedRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
    const list = Array.isArray(roles) ? roles : [roles];
    return list.map((r) => String(r).replace(/\s+/g, '').toLowerCase()).includes(normalizedRole);
  };

  return {
    hasPermission,
    can: hasPermission,
    hasRole,
    user,
    projectRole,
    projectRoleDisplay,
    isProjectAdmin,
    isProjectSuperAdmin,
    isProjectManager,
    isTeamMember,
    isProjectEmployee,
  };
}

export default usePermission;
