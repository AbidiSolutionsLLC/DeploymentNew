const mongoose = require('mongoose');
process.env.MONGODB_URI = "mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000";
const User = require('c:/Users/TayyabSaleem/Desktop/Projects/Karbexa/backend/models/userSchema');
const Timesheet = require('c:/Users/TayyabSaleem/Desktop/Projects/Karbexa/backend/models/timesheetSchema');
const TimeLog = require('c:/Users/TayyabSaleem/Desktop/Projects/Karbexa/backend/models/timeLogsSchema');

const userId = '69c1a6624d052404b38cf35a';
const approverId = '6972a36d5c099a741f3c754d'; 

const userStories = [
  "SOWAYE-146: Log All System and User Actions",
  "SOWAYE-147: Filter and Search Logs",
  "SOWAYE-148: Export Audit Logs",
  "SOWAYE-149: Ensure Logs Are Immutable",
  "SOWAYE-150: Define Log Retention Policies",
  "SOWAYE-151: Restrict Access to Logs",
  "SOWAYE-152: Track High-Risk Actions in Detail",
  "SOWAYE-153: Monitor Logs in Real Time",
  "SOWAYE-154: Verify Log Integrity",
  "SOWAYE-155: Trigger Alerts from Logs",
  "SOWAYE-156: Categorize Logs by Type",
  "SOWAYE-157: Ensure Tenant-Level Log Isolation",
  "SOWAYE-159: View System Health Insights",
  "SOWAYE-160: Detect System Misconfigurations",
  "SOWAYE-161: Provide Actionable Recommendations",
  "SOWAYE-162: Explain Insights and Recommendations",
  "SOWAYE-163: Update Insights in Near Real-Time",
  "SOWAYE-164: Prioritize Insights by Severity",
  "SOWAYE-165: Manage Insight Status",
  "SOWAYE-166: Validate System-Wide Consistency",
  "SOWAYE-167: Notify Admins of Critical Insights",
  "SOWAYE-168: Track Insight History",
  "SOWAYE-169: Suggest or Auto-Fix Issues",
  "SOWAYE-170: Reduce Insight Noise",
  "SOWAYE-187: IP-Based Access Restriction"
];

let startDate = new Date('2026-08-05T00:00:00Z');

async function run() {
  try {
process.env.MONGODB_URI = "mongodb://abidi_pro:5DtJcxVMpQu1z2DY@ac-86jd9op-shard-00-00.v2scegv.mongodb.net:27017,ac-86jd9op-shard-00-01.v2scegv.mongodb.net:27017,ac-86jd9op-shard-00-02.v2scegv.mongodb.net:27017/?ssl=true&replicaSet=atlas-kvo9b7-shard-0&authSource=admin&appName=Cluster0";
await mongoose.connect(process.env.MONGODB_URI);

    const employee = await User.findById(userId);
    const employeeName = employee ? employee.firstName + ' ' + employee.lastName : 'Tayyab Saleem';
    const company = employee ? employee.company : null;

    let storyIndex = 0;
    let currentDay = new Date(startDate);

    while (storyIndex < userStories.length) {
      let dailyStories = [];
      for (let i = 0; i < 3 && storyIndex < userStories.length; i++) {
        dailyStories.push(userStories[storyIndex]);
        storyIndex++;
      }
      
      if (dailyStories.length === 1) {
          dailyStories.push("Implement " + dailyStories[0].split(':')[0]);
          dailyStories.push("Test " + dailyStories[0].split(':')[0]);
      } else if (dailyStories.length === 2) {
          dailyStories.push("Test integration for recent stories");
      }

      const startOfDay = new Date(currentDay);
      startOfDay.setUTCHours(0,0,0,0);
      const endOfDay = new Date(currentDay);
      endOfDay.setUTCHours(23,59,59,999);

      let timesheet = await Timesheet.findOne({ 
          employee: userId, 
          date: { $gte: startOfDay, $lte: endOfDay } 
      });

      if (!timesheet) {
        timesheet = new Timesheet({
          name: "Timesheet for " + currentDay.toISOString().split('T')[0],
          description: "Development tasks",
          employee: userId,
          employeeName: employeeName,
          company: company,
          date: currentDay,
          submittedHours: 8,
          approvedHours: 8,
          status: "Approved",
          timeLogs: []
        });
        await timesheet.save();
        console.log("Created timesheet for", currentDay.toISOString().split('T')[0]);
      } else {
        console.log("Timesheet already exists for", currentDay.toISOString().split('T')[0]);
        timesheet.status = "Approved";
        timesheet.approvedHours = 8;
        await timesheet.save();
      }

      const hoursArray = [3, 3, 2];
      let createdLogs = [];
      
      for (let i = 0; i < 3; i++) {
        const existingLog = await TimeLog.findOne({
            employee: userId,
            date: { $gte: startOfDay, $lte: endOfDay },
            description: dailyStories[i]
        });
        
        if (!existingLog) {
            const timeLog = new TimeLog({
                employee: userId,
                job: "Development",
                company: company,
                date: currentDay,
                description: dailyStories[i],
                hours: hoursArray[i],
                isAddedToTimesheet: true,
                timesheet: timesheet._id
            });
            await timeLog.save();
            createdLogs.push(timeLog._id);
        } else {
            if(!timesheet.timeLogs.includes(existingLog._id)) {
                createdLogs.push(existingLog._id);
            }
        }
      }

      if (createdLogs.length > 0) {
        createdLogs.forEach(id => {
            if(!timesheet.timeLogs.includes(id)) {
                timesheet.timeLogs.push(id);
            }
        });
        await timesheet.save();
      }

      do {
        currentDay.setDate(currentDay.getDate() + 1);
      } while (currentDay.getDay() === 0 || currentDay.getDay() === 6);
    }

    console.log("Done!");
    return { success: true };

  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
}

module.exports = run;
