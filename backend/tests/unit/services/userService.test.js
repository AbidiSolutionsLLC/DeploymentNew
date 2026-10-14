const userService = require('../../../services/userService');
const User = require('../../../models/userSchema');
const Department = require('../../../models/department');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Mock email service and notification service to prevent side effects
jest.mock('../../../utils/emailService', () => jest.fn().mockResolvedValue(true));
jest.mock('../../../utils/notificationService', () => ({
  createNotification: jest.fn().mockResolvedValue(true)
}));

describe('UserService', () => {
  const dummyCompanyId = new mongoose.Types.ObjectId();

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
        role: 'Employee',
        company: dummyCompanyId
      });

      const empId = await userService.generateEmpID();
      expect(empId).toBe('EMP-046');
    });
  });

  describe('createUser', () => {
    it('should throw an error if the actor does not have permissions', async () => {
      const actor = { _id: 'fakeid', role: 'Employee' };
      const newUserData = { email: 'new@test.com', name: 'New User', role: 'Employee', company: dummyCompanyId };
      
      await expect(userService.createUser(actor, newUserData))
        .rejects.toThrow('You do not have permission to manage users.');
    });

    it('should successfully create a new user and hash their password', async () => {
      const actor = { _id: 'fakeid', role: 'Super Admin', company: dummyCompanyId };
      const newUserData = { 
        email: 'secure@test.com', 
        name: 'Secure User', 
        password: 'StrongPassword123!',
        role: 'Employee',
        company: dummyCompanyId
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
      const actor = { _id: 'fakeid', role: 'Super Admin', company: dummyCompanyId };
      await User.create({
        name: 'Existing',
        email: 'duplicate@test.com',
        role: 'Employee',
        company: dummyCompanyId
      });

      const newUserData = { email: 'duplicate@test.com', name: 'Duplicate User', role: 'Employee', company: dummyCompanyId };
      await expect(userService.createUser(actor, newUserData))
        .rejects.toThrow('User with this email already exists');
    });
  });

  describe('updateUser (permissions & empType restrictions)', () => {
    it('should block an employee from updating their own employment type', async () => {
      const employee = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Employee',
        empType: 'Permanent',
        company: dummyCompanyId
      });

      const actor = { _id: employee._id, role: 'Employee', company: dummyCompanyId };

      await expect(
        userService.updateUser(actor, employee._id, { empType: 'Contractor' })
      ).rejects.toThrow('You cannot update your own employment type.');

      // Verify empType remained unchanged
      const freshUser = await User.findById(employee._id);
      expect(freshUser.empType).toBe('Permanent');
    });

    it('should allow an employee to update allowed personal fields (e.g., about, phoneNumber)', async () => {
      const employee = await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        role: 'Employee',
        empType: 'Permanent',
        company: dummyCompanyId
      });

      const actor = { _id: employee._id, role: 'Employee', company: dummyCompanyId };

      const updated = await userService.updateUser(actor, employee._id, {
        about: 'I am a software engineer',
        phoneNumber: '1234567890'
      });

      expect(updated.about).toBe('I am a software engineer');
      expect(updated.phoneNumber).toBe('1234567890');
    });

    it('should allow an Admin to update an employee employment type', async () => {
      const employee = await User.create({
        name: 'Mark Doe',
        email: 'mark@example.com',
        role: 'Employee',
        empType: 'Permanent',
        company: dummyCompanyId
      });

      const admin = await User.create({
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'Admin',
        company: dummyCompanyId
      });

      const updated = await userService.updateUser(admin, employee._id, { empType: 'Contractor' });
      expect(updated.empType).toBe('Contractor');
    });
  });
});
