const Timesheet = require("../models/timesheetSchema");
const User = require("../models/userSchema");
const Payslip = require("../models/payslipSchema");

class PayrollService {
  async previewPayroll(user, startDate, endDate, standardHours = 0) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    let userQuery = {};
    if (user.company) {
       userQuery.company = user.company;
    }
    
    const users = await User.find(userQuery).select('name email designation department hourlyWage empID');
    const userIds = users.map(u => u._id);
    
    const timeLogs = await Timesheet.find({
      employee: { $in: userIds },
      date: { $gte: start, $lte: end }
    });
    
    const payrollData = users.map(employee => {
       const userLogs = timeLogs.filter(log => log.employee.toString() === employee._id.toString());
       const totalHoursTracked = parseFloat(userLogs.reduce((sum, log) => sum + (log.submittedHours || 0), 0).toFixed(2));
       
       const hourlyWage = employee.hourlyWage || 0;
       const extraHours = Math.max(0, parseFloat((totalHoursTracked - standardHours).toFixed(2)));
       const totalWages = parseFloat((totalHoursTracked * hourlyWage).toFixed(2));
       
       return {
          employee,
          totalHoursTracked,
          extraHours,
          standardHours,
          hourlyWage,
          totalWages
       };
    });
    
    // Only return users who have hours tracked or an hourly wage set, to avoid clutter
    return payrollData.filter(p => p.totalHoursTracked > 0 || p.hourlyWage > 0);
  }
  
  async generatePayslips(user, data) {
    const payslipsToInsert = data.payslips.map(p => {
       const finalHours = p.adjustedHours !== null && p.adjustedHours !== undefined ? p.adjustedHours : p.totalHoursTracked;
       const finalWage = p.adjustedWage !== null && p.adjustedWage !== undefined ? p.adjustedWage : p.hourlyWage;
       const calculatedWages = parseFloat((finalHours * finalWage).toFixed(2));

       return {
         employee: p.employeeId,
         company: user.company,
         periodStartDate: new Date(data.periodStartDate),
         periodEndDate: new Date(data.periodEndDate),
         totalHoursTracked: p.totalHoursTracked,
         adjustedHours: p.adjustedHours || null,
         standardHours: data.standardHours || 0,
         extraHours: p.extraHours || 0,
         hourlyWage: p.hourlyWage,
         adjustedWage: p.adjustedWage || null,
         totalWages: calculatedWages,
         status: 'Generated',
         generatedBy: user.id
       };
    });
    
    return await Payslip.insertMany(payslipsToInsert);
  }
  
  async getPayslipHistory(user) {
    let query = {};
    if (user.company) {
       query.company = user.company;
    }
    
    return Payslip.find(query)
      .populate('employee', 'name email designation empID avatar')
      .populate('generatedBy', 'name')
      .sort({ createdAt: -1 });
  }
}

module.exports = new PayrollService();
