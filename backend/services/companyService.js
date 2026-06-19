const Company = require("../models/companySchema");
const { NotFoundError } = require("../utils/ExpressError");
const { createNotification } = require('../utils/notificationService');
const UserModel = require("../models/userSchema");

class CompanyService {
  async createCompany(data) {
    const newCompany = new Company(data);
    return newCompany.save();
  }

  async getAllCompanies() {
    return Company.find();
  }

  async getCompanyById(id) {
    const company = await Company.findById(id);
    if (!company) throw new NotFoundError("Company");
    return company;
  }

  async updateCompany(id, updates) {
    const company = await Company.findById(id);
    if (!company) throw new NotFoundError("Company");

    Object.assign(company, updates);
    const updatedCompany = await company.save();

    try {
      const admins = await UserModel.find({
        $or: [{ role: 'Super Admin' }, { role: 'Admin' }]
      }).select('_id');
      
      admins.forEach(admin => {
        createNotification({
          recipient: admin._id,
          type: 'COMPANY_UPDATED',
          title: 'Company Profile Updated',
          message: `Company profile details for "${updatedCompany.companyName}" have been updated.`,
          relatedEntity: { entityType: 'company', entityId: updatedCompany._id },
        }).catch(console.error);
      });
    } catch (notifErr) {
      console.error('[Notification] Company update:', notifErr.message);
    }

    return updatedCompany;
  }

  async deleteCompany(id) {
    const company = await Company.findByIdAndDelete(id);
    if (!company) throw new NotFoundError("Company");
  }
}

module.exports = new CompanyService();
