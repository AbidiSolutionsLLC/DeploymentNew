const BaseRepository = require('./baseRepository');
const User = require('../models/userSchema');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, includePassword = false) {
    let query = this.model.findOne({ email });
    if (includePassword) {
      query = query.select('+password');
    }
    return query.exec();
  }

  async findByEmailWithAuth(email) {
    return this.model.findOne({ email }).select('+otp +otpExpires +otpGeneratedAt +password');
  }

  async findByRefreshToken(refreshToken) {
    return this.model.findOne({ refreshToken });
  }

  async findByResetToken(hashedToken) {
    return this.model.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
  }

  async getLastEmpId() {
    return this.model.findOne({}, { empID: 1 }).sort({ createdAt: -1 }).exec();
  }
}

module.exports = new UserRepository();
