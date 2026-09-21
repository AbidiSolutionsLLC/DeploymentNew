import { useSelector } from 'react-redux';
import PERMISSIONS from '../constants/permissions';

export function usePermission() {
  const { user } = useSelector((state) => state.auth);

  return {
    hasPermission: (permission) => {
      if (!user) return false;

      // Custom rule for ticketing assignment if user is a technician
      if (permission === 'tickets:assign' && user.isTechnician === true) {
        return true;
      }
      
      // Custom rule for manager reading team tickets if they are a technician
      if (permission === 'tickets:read:team' && user.isTechnician === true && user.role?.replace(/\s+/g, '').toLowerCase() === 'manager') {
        return true;
      }

      const allowedRoles = PERMISSIONS[permission];
      if (!allowedRoles) return false;

      if (allowedRoles.includes('*')) return true;

      const userRole = (user.role || '').replace(/\s+/g, '').toLowerCase();
      return allowedRoles.includes(userRole);
    },
  };
}
