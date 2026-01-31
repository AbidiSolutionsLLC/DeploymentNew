const User = require("../models/userSchema");

/**
 * Returns a MongoDB query filter based on the user's Role & Feature.
 * @param {Object} currentUser - The user object from req.user
 * @param {String} type - 'attendance' | 'ticket' | 'leave'
 * @returns {Object} MongoDB Query Object
 */
exports.getSearchScope = async (currentUser, type) => {
  // Safety Check
  if (!currentUser) return { _id: null }; 

  const { role, isTechnician, _id } = currentUser;
  
  // Normalize Role: "Super Admin" -> "superadmin"
  const roleKey = role ? role.replace(/\s+/g, '').toLowerCase() : "employee";

  // --- 1. SUPER ADMIN / HR: God Mode ---
  if (roleKey === 'superadmin' || roleKey === 'hr') {
    // HR Restriction: HR should NOT see tickets (if that's the rule)
    // If you want HR to see tickets, remove this if-block.
    if (type === 'ticket' && roleKey === 'hr') {
        return { _id: null }; // Block HR from tickets
    }
    return {}; // See everything else
  }

  // --- 2. TECHNICIAN (Ticket View Only) ---
  if (type === 'ticket' && isTechnician) {
    return { 
      $or: [
        { assignedTo: _id },
        { closedBy: _id }, // Created by me (Schema uses closedBy for creator)
        { user: _id }      // Created by me (Legacy field)
      ] 
    };
  }

  // --- 3. ADMIN & MANAGER: Team View ---
  if (roleKey === 'admin' || roleKey === 'manager') { 
    // Find Direct Reports
    const directReports = await User.find({ reportsTo: _id }).distinct('_id');
    
    // Find Indirect Reports (Team of my Team) - 1 Level Deep
    const indirectReports = await User.find({ reportsTo: { $in: directReports } }).distinct('_id');
    
    const fullTeam = [...directReports, ...indirectReports, _id];

    // Return specific filters based on module
    if (type === 'ticket') return { closedBy: { $in: fullTeam } };
    if (type === 'leave') return { employee: { $in: fullTeam } };
    
    // Default (Attendance / User List)
    return { _id: { $in: fullTeam } };
  }

  // --- 4. EMPLOYEE: Self View Only ---
  if (type === 'ticket') return { closedBy: _id };
  if (type === 'leave') return { employee: _id };
  
  // Default Self Lock for safety
  return { _id: _id };
};