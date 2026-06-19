const userService = require('../../../services/userService');
const User = require('../../../models/userSchema');
const Department = require('../../../models/department');
const bcrypt = require('bcryptjs');

// Mock email service and notification service to prevent side effects
jest.mock('../../../utils/emailService', () => jest.fn().mockResolvedValue(true));
jest.mock('../../../utils/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(true)
}));

describe('UserService', () => {
  describe('generateEmpID', () => {
    it('should generate EMP-001 if no users exist', async () => {
      const empId = await userService.generateEmpID();
      expect(empId).toBe('EMP-001');
    });

    it('should increment the highest existing EMP ID', async () => {
      await User.create({
        name: 'Test 1',
        email: 'test1@test.com',
        empID: 'EMP-045',
        role: 'Employee'
      });

      const empId = await userService.generateEmpID();
      expect(empId).toBe('EMP-046');
    });
  });

  describe('createUser', () => {
    it('should throw an error if the actor does not have permissions', async () => {
      const actor = { _id: 'fakeid', role: 'Employee' };
      const newUserData = { email: 'new@test.com', name: 'New User', role: 'Employee' };
      
      await expect(userService.createUser(actor, newUserData))
        .rejects.toThrow('You do not have permission to manage users.');
    });

    it('should successfully create a new user and hash their password', async () => {
      const actor = { _id: 'fakeid', role: 'Super Admin' };
      const newUserData = { 
        email: 'secure@test.com', 
        name: 'Secure User', 
        password: 'StrongPassword123!',
        role: 'Employee' 
      };

      const savedUser = await userService.createUser(actor, newUserData);
      
      expect(savedUser.email).toBe('secure@test.com');
      expect(savedUser.empID).toBeDefined();

      // Retrieve from DB to verify password hash
      const dbUser = await User.findById(savedUser._id).select('+password');
      expect(dbUser.password).not.toBe('StrongPassword123!');
      const isMatch = await bcrypt.compare('StrongPassword123!', dbUser.password);
      expect(isMatch).toBe(true);
    });

    it('should throw if email already exists', async () => {
      const actor = { _id: 'fakeid', role: 'Super Admin' };
      await User.create({
        name: 'Existing',
        email: 'duplicate@test.com',
        role: 'Employee'
      });

      const newUserData = { email: 'duplicate@test.com', name: 'Duplicate User', role: 'Employee' };
      await expect(userService.createUser(actor, newUserData))
        .rejects.toThrow('User with this email already exists');
    });
  });
});
