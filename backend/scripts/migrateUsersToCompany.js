const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../models/userSchema');
const Company = require('../models/companySchema'); // Assuming companySchema exists

async function migrateUsers() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB.");

    let company = await Company.findOne({ companyName: "Abidi Solutions" });
    if (!company) {
      console.log("Creating Abidi Solutions company...");
      company = new Company({
        companyName: "Abidi Solutions",
        companyEmail: "admin@abidisolutions.com",
        contactNo: "0000000000",
        companyType: "Tech",
        noOfEmployees: 10,
        website: "https://abidisolutions.com",
        address: "123 Main St",
        companyOwner: "Admin"
      });
      await company.save();
    }
    
    console.log(`Company ID for Abidi Solutions is: ${company._id}`);

    console.log("Updating all users...");
    const result = await User.updateMany({}, { $set: { company: company._id } });
    
    console.log(`Migration completed. Modified ${result.modifiedCount} users.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrateUsers();
