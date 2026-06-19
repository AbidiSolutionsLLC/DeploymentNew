const authService = require('../../../services/authService');
const userRepository = require('../../../repositories/userRepository');
const Company = require('../../../models/companySchema');
const User = require('../../../models/userSchema');
const bcrypt = require('bcryptjs');

// Mock external services to prevent sending actual emails during tests
jest.mock('../../../config/emailConfig', () => ({
  sendOTPEmail: jest.fn().mockResolvedValue(true),
  sendForgotPasswordEmail: jest.fn().mockResolvedValue(true)
}));

describe('AuthService', () => {
  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = authService.generateOTP();
      expect(otp).toBeGreaterThanOrEqual(100000);
      expect(otp).toBeLessThanOrEqual(999999);
    });
  });

  describe('generateResetToken', () => {
    it('should generate a 64-character hex string', () => {
      const token = authService.generateResetToken();
      expect(typeof token).toBe('string');
      expect(token).toHaveLength(64);
    });
  });

  describe('login', () => {
    it('should throw BadRequestError if user is not found', async () => {
      await expect(authService.login('nonexistent@test.com', 'password123'))
        .rejects.toThrow('You are not registered. Please sign up first.');
    });

    it('should throw BadRequestError on invalid password', async () => {
      // First, create a company and a user
      const company = await Company.create({
        companyName: 'Test Corp 1',
        companyOwner: 'Owner 1',
        contactNo: '1234567890',
        companyEmail: 'test1@corp.com',
        website: 'https://testcorp1.com',
        address: '123 Street',
        noOfEmployees: 10,
        companyType: 'Tech'
      });
      const user = await User.create({
        name: 'John Doe',
        email: 'john@test.com',
        password: 'correctpassword',
        role: 'Admin',
        company: company._id
      });

      await expect(authService.login('john@test.com', 'wrongpassword'))
        .rejects.toThrow('Invalid password');
    });

    it('should generate an OTP and save it on successful login', async () => {
      const company = await Company.create({
        companyName: 'Test Corp 2',
        companyOwner: 'Owner 2',
        contactNo: '0987654321',
        companyEmail: 'test2@corp.com',
        website: 'https://testcorp2.com',
        address: '456 Road',
        noOfEmployees: 20,
        companyType: 'Tech'
      });
      const user = await User.create({
        name: 'Jane Doe',
        email: 'jane@test.com',
        password: 'correctpassword',
        role: 'Admin',
        company: company._id
      });

      const resultUser = await authService.login('jane@test.com', 'correctpassword');
      
      expect(resultUser.email).toBe('jane@test.com');
      
      // Fetch user from DB to verify OTP was saved (it is selected explicitly since select: false in schema)
      const dbUser = await User.findById(resultUser._id).select('+otp +otpExpires');
      expect(dbUser.otp).toBeDefined();
      expect(dbUser.otpExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });
});
