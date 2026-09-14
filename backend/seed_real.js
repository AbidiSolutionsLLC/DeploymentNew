const mongoose = require('mongoose');
const User = require('./models/userSchema');
const Timesheet = require('./models/timesheetSchema');
const TimeLog = require('./models/timeLogsSchema');
const TimeTracker = require('./models/timeTrackerSchema');

const MONGODB_URI = "mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000";

const userId = '69cd26370b4e675c0b37798c';
const approverId = '6972a36d5c099a741f3c754d'; 

const userStories = [
  "Sowaye-120: Define Notification Triggers",
  "Sowaye-121: Configure Notification Delivery Channels",
  "Sowaye-122: Customize Notification Templates",
  "Sowaye-123: Control Notification Frequency",
  "Sowaye-124: Override Notification Preferences for Critical Alerts",
  "Sowaye-125: Allow Users to Manage Notification Preferences",
  "Sowaye-126: Provide Notification History",
  "Sowaye-127: Ensure Reliable Notification Delivery",
  "Sowaye-128: Target Notifications Dynamically",
  "Sowaye-129: Define Notification Priority Levels",
  "Sowaye-130: Support Multi-Language Notifications",
  "Sowaye-131: Track Notification Effectiveness",
  "Sowaye-133: Define Notification Triggers",
  "Sowaye-134: Configure Notification Delivery Channels",
  "Sowaye-135: Customize Notification Templates",
  "Sowaye-136: Control Notification Frequency and Digest Settings",
  "Sowaye-137: Override Preferences for Critical Alerts",
  "Sowaye-138: Manage User Notification Preferences",
  "Sowaye-139: View Notification History",
  "Sowaye-140: Target Notifications Dynamically",
  "Sowaye-141: Define Notification Priority",
  "Sowaye-142: Ensure Notification Delivery Reliability",
  "Sowaye-143: Track Notification Performance",
  "Sowaye-144: Support Multi-Language Notifications"
];

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000
}).then(async () => {
    console.log('Connected to DB. Checking trackers...');

    const employee = await User.findById(userId);
    const employeeName = employee ? employee.firstName + ' ' + employee.lastName : 'Tayyab Saleem';
    const company = employee ? employee.company : null;

    const startDate = new Date('2026-08-05T00:00:00Z');
    
    // Find all trackers for the user on or after Aug 5, 2026
    const trackers = await TimeTracker.find({
        user: userId,
        date: { $gte: startDate }
    }).sort({ date: 1 });
    
    console.log(`Found ${trackers.length} time trackers since August 5, 2026.`);

    let storyIndex = 0;
    
    for (const tracker of trackers) {
        // present check
        if (tracker.status === 'Present' || (tracker.checkInTime && tracker.checkOutTime)) {
            let currentDay = new Date(tracker.date);
            console.log(`Processing present day: ${currentDay.toISOString().split('T')[0]}`);
            
            let dailyStories = [];
            for (let i = 0; i < 3; i++) {
                if (storyIndex < userStories.length) {
                    dailyStories.push(userStories[storyIndex]);
                    storyIndex++;
                } else {
                    dailyStories.push("Review and testing fixes");
                }
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
                    approvedBy: approverId,
                    approver: approverId,
                    timeLogs: []
                });
                await timesheet.save();
                console.log("Created timesheet for", currentDay.toISOString().split('T')[0]);
            } else {
                console.log("Timesheet already exists for", currentDay.toISOString().split('T')[0]);
                timesheet.status = "Approved";
                timesheet.approvedHours = 8;
                timesheet.submittedHours = 8;
                timesheet.approvedBy = approverId;
                timesheet.approver = approverId;
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
                    console.log(`Added time log for: ${dailyStories[i]}`);
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
        }
    }

    console.log("Finished generating timesheets and logs!");
    process.exit(0);

}).catch(e => {
    console.error(e);
    process.exit(1);
});
