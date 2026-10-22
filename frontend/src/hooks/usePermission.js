import { useSelector } from 'react-redux';
import PERMISSIONS from '../constants/permissions';

export function usePermission() {
  const { user } = useSelector((state) => state.auth);

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
      return Boolean(user.hasProjectPortalAccess);
    }

    const allowedRoles = PERMISSIONS[permission];
    if (!allowedRoles) return false;

    if (allowedRoles.includes('*')) return true;

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
  };
}

export default usePermission;
