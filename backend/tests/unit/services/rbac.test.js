const { getSearchScope, getApprovalScope } = require('../../../utils/rbac');
const mongoose = require('mongoose');

describe('RBAC Scopes', () => {
  const hrUser = { _id: new mongoose.Types.ObjectId(), role: 'HR', isTechnician: false };
  const adminUser = { _id: new mongoose.Types.ObjectId(), role: 'Admin', isTechnician: false };
  const managerUser = { _id: new mongoose.Types.ObjectId(), role: 'Manager', isTechnician: false };

  describe('getApprovalScope', () => {
    it('should exclude the current user from expense approval queue', async () => {
      const scope = await getApprovalScope(managerUser, 'expense');
      // For expense, userField is submittedBy
      // getSearchScope returns { submittedBy: { $in: [...] } }
      // getApprovalScope adds { submittedBy: { $ne: managerUser._id } } via $and
      
      expect(scope.$and).toBeDefined();
      expect(scope.$and[1].submittedBy.$ne).toEqual(managerUser._id);
    });

    it('should exclude the current user from timesheet approval queue', async () => {
      const scope = await getApprovalScope(adminUser, 'timesheet');
      // For timesheet, userField is employee
      expect(scope.$and).toBeDefined();
      expect(scope.$and[1].employee.$ne).toEqual(adminUser._id);
    });
  });
});
