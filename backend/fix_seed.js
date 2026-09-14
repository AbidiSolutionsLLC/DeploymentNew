const mongoose = require('mongoose');
const User = require('./models/userSchema');
const Timesheet = require('./models/timesheetSchema');
const TimeLog = require('./models/timeLogsSchema');
const TimeTracker = require('./models/timeTrackerSchema');

const MONGODB_URI = "mongodb+srv://AbbasAdil:m4y6_EuQpB7iFcH@hrportal.global.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000";

const usersData = [
  {
    userId: '69c1a6624d052404b38cf35a',
    approverId: '6972a36d5c099a741f3c754d',
    stories: [
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
    ]
  },
  {
    userId: '69cd26370b4e675c0b37798c',
    approverId: '6972a36d5c099a741f3c754d',
    stories: [
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
    ]
  }
];

function splitStoryIntoSubTasks(story) {
    const ticket = story.includes(':') ? story.split(':')[0].trim() : story;
    
    const taskMap = {
      'SOWAYE-146': [
        'Set up database schema and middleware for capturing user and system actions',
        'Implement logging logic for authentication, profile updates, and config changes',
        'Write unit tests to verify real-time log creation and validate payloads'
      ],
      'SOWAYE-147': [
        'Build search query builder and backend endpoints for log filtering',
        'Create UI filters for users, actions, and date ranges',
        'Optimize database indexes to ensure fast loading on large datasets'
      ],
      'SOWAYE-148': [
        'Implement logic for generating CSV and JSON export formats',
        'Integrate RBAC to enforce export permissions',
        'Test export formatting and ensure export actions are logged'
      ],
      'SOWAYE-149': [
        'Lock down update and delete API routes for log entries',
        'Implement append-only database constraints and data integrity checks',
        'Test tamper-proofing mechanisms to ensure compliance-grade security'
      ],
      'SOWAYE-150': [
        'Build admin configuration UI for setting log retention periods',
        'Create automated cron jobs for archiving and deleting expired logs',
        'Write integration tests for automated cleanup and retention enforcement'
      ],
      'SOWAYE-151': [
        'Set up role-based access middleware for log viewing',
        'Apply access checks to all log-related API endpoints',
        'Verify unauthorized access attempts are blocked and logged'
      ],
      'SOWAYE-152': [
        'Identify and tag high-risk action triggers in the system',
        'Add logic to capture before and after state diffs in log records',
        'Test granular detail capture during permission and policy updates'
      ],
      'SOWAYE-153': [
        'Set up WebSockets or Server-Sent Events for log streaming',
        'Push real-time log updates to the frontend admin dashboard',
        'Test real-time delivery mechanisms and ensure zero refresh latency'
      ],
      'SOWAYE-154': [
        'Research and implement cryptographic hash generation for logs',
        'Build a verification endpoint to validate log checksums',
        'Test tampering detection to confirm log integrity'
      ],
      'SOWAYE-155': [
        'Integrate notification module to subscribe to critical log events',
        'Define trigger conditions for failed logins and admin changes',
        'Execute end-to-end testing for alert generation based on logs'
      ],
      'SOWAYE-156': [
        'Update logging schema to support categories like Security and Admin',
        'Tag existing integration points with the correct log categories',
        'Update frontend filters and navigation to support log categorization'
      ],
      'SOWAYE-157': [
        'Add tenant ID enforcement checks to all log queries and inserts',
        'Implement safeguards against cross-tenant data leaks',
        'Write integration tests to verify strict multi-tenant isolation'
      ],
      'SOWAYE-159': [
        'Design layout and components for the system health dashboard',
        'Aggregate metrics for critical issues, warnings, and insights',
        'Wire frontend components to health aggregation endpoints'
      ],
      'SOWAYE-160': [
        'Develop rules engine to detect missing or conflicting configurations',
        'Automate background detection jobs to flag misconfigurations',
        'Refine detection logic to minimize false positives and alert noise'
      ],
      'SOWAYE-161': [
        'Map detected misconfigurations to specific resolution paths',
        'Build UI links allowing admins to navigate directly to fix locations',
        'Validate the accuracy and context of dynamic recommendations'
      ],
      'SOWAYE-162': [
        'Draft plain-text, non-technical explanations for system insights',
        'Add detailed reasoning and logic condition tooltips to the UI',
        'Review explanation clarity and context for admins'
      ],
      'SOWAYE-163': [
        'Wire system state changes directly to insight triggers',
        'Implement cache invalidation to prevent stale insights on the dashboard',
        'Verify real-time reflection of insights following configuration changes'
      ],
      'SOWAYE-164': [
        'Develop severity weighting algorithms (Critical, High, Medium, Low)',
        'Build UI highlighting and prioritization sorting for critical issues',
        'Implement and test severity-based filtering on the dashboard'
      ],
      'SOWAYE-165': [
        'Create APIs for resolving and dismissing specific insights',
        'Track insight states in the DB and manage reappearance logic',
        'Build frontend state management for open vs resolved insights'
      ],
      'SOWAYE-166': [
        'Write cross-module integrity checks between Identity, Access, and Policy',
        'Detect missing links and surface conflicts as dashboard insights',
        'Test system-wide consistency validators under various configurations'
      ],
      'SOWAYE-167': [
        'Connect critical insights directly to the alert notification system',
        'Build admin preference toggles for configuring alert notifications',
        'Test end-to-end notification routing for critical events'
      ],
      'SOWAYE-168': [
        'Create database schema for storing historical insight records',
        'Build dashboard views for tracking trends and recurring issues',
        'Test data aggregation and historical data retrieval performance'
      ],
      'SOWAYE-169': [
        'Develop automation scripts for Suggest or Auto-Fix Issue actions',
        'Add confirmation modals, safety checks, and action logging',
        'Test safe application of automated fixes across environments'
      ],
      'SOWAYE-170': [
        'Implement deduplication logic to group redundant insights',
        'Build sensitivity configuration settings for admin noise reduction',
        'Tune alert thresholds to ensure only meaningful insights are shown'
      ],
      'SOWAYE-187': [
        'Build IP range and CIDR validation middleware for access control',
        'Create admin UI for managing and configuring allowed IP addresses',
        'Test block and allow routing to ensure strict IP enforcement'
      ],
      'Sowaye-120': [
        'Set up event listener registry for workflow and security events',
        'Build API endpoints for configuring target audiences and triggers',
        'Test automated notification generation based on enabled triggers'
      ],
      'Sowaye-121': [
        'Abstract notification service to handle both Email and In-app channels',
        'Build user-channel mapping and configuration UI',
        'Test delivery reliability and multi-channel routing logic'
      ],
      'Sowaye-122': [
        'Build CRUD endpoints for notification templates with dynamic variables',
        'Implement message rendering engine with basic formatting support',
        'Create frontend preview functionality for rendered templates'
      ],
      'Sowaye-123': [
        'Build cron jobs to handle batched notifications (hourly, daily, weekly)',
        'Create admin and user UI for configuring digest frequency',
        'Test notification grouping and digest formatting logic'
      ],
      'Sowaye-124': [
        'Add critical flag bypass logic to override user frequency settings',
        'Update UI to visually distinguish critical security/system alerts',
        'Test guaranteed immediate delivery for critical notifications'
      ],
      'Sowaye-125': [
        'Build user settings interface for managing notification preferences',
        'Update backend delivery service to respect user opt-outs and channels',
        'Test preference overrides and edge cases with critical alerts'
      ],
      'Sowaye-126': [
        'Create database schema and indexing for notification history',
        'Build pagination, search API, and mark read/unread functionality',
        'Develop frontend view for users to browse past notifications'
      ],
      'Sowaye-127': [
        'Implement retry queues and backoff logic for failed email deliveries',
        'Build an admin view to monitor notification delivery statuses',
        'Test failure recovery and ensure failed events are accurately logged'
      ],
      'Sowaye-128': [
        'Build dynamic evaluation engine for roles, groups, and locations',
        'Implement attribute-based filtering for notification targeting',
        'Verify targeting accuracy against large and complex user groups'
      ],
      'Sowaye-129': [
        'Define priority level enums and adjust delivery queue behavior',
        'Implement visual indicators and sorting for priorities in the UI',
        'Test priority sorting and processing speed under high loads'
      ],
      'Sowaye-130': [
        'Integrate localization library and set up translation mappings',
        'Update template engine to support multi-language string replacements',
        'Test user locale detection and fallback language defaults'
      ],
      'Sowaye-131': [
        'Implement tracking pixels and click-through metrics for emails',
        'Aggregate delivery and open rates into backend statistics',
        'Build analytics dashboard for admins to track effectiveness'
      ],
      'Sowaye-133': [
        'Extend trigger scope for advanced workflow escalations',
        'Enhance audience targeting logic for complex system events',
        'Validate trigger condition evaluations in staging environment'
      ],
      'Sowaye-134': [
        'Refactor channel routing strategy for improved simultaneous sends',
        'Optimize in-app notification state management and syncing',
        'Verify channel delivery constraints based on notification type'
      ],
      'Sowaye-135': [
        'Add basic HTML styling and branding support to templates',
        'Expand dynamic variable support for deeper event context',
        'Refine template rendering engine for faster processing'
      ],
      'Sowaye-136': [
        'Optimize batching queries to improve digest generation speed',
        'Resolve overlap and duplication issues in daily/weekly digests',
        'Test complex user override scenarios within batched constraints'
      ],
      'Sowaye-137': [
        'Audit critical alert coverage across all modules',
        'Hardcode bypass checks directly in the final delivery layer',
        'Execute end-to-end testing for guaranteed critical alert flows'
      ],
      'Sowaye-138': [
        'Add granular notification type toggles for individual users',
        'Improve preferences UI/UX for easier channel management',
        'Ensure real-time sync between preferences and the delivery service'
      ],
      'Sowaye-139': [
        'Optimize history query performance for users with many alerts',
        'Add advanced search filters and date range selectors to history',
        'Update read/unread batch actions for better UX'
      ],
      'Sowaye-140': [
        'Enhance condition evaluation speed for dynamic targeting',
        'Support complex nested targeting rules and exclusions',
        'Validate targeted broadcast logic against edge cases'
      ],
      'Sowaye-141': [
        'Tie notification priority directly to queue processing allocation',
        'Polish UI priority badges and accessible indicators',
        'Verify priority queue behavior prevents low-priority bottlenecks'
      ],
      'Sowaye-142': [
        'Enhance dead-letter queue handling for permanent delivery failures',
        'Add detailed failure reason logging for admins',
        'Create retry limits to prevent infinite loops on broken channels'
      ],
      'Sowaye-143': [
        'Improve tracking pixel accuracy and filter bot opens',
        'Add real-time analytics updates to the effectiveness dashboard',
        'Implement CSV export functionality for analytics data'
      ],
      'Sowaye-144': [
        'Expand language dictionary coverage for new templates',
        'Build automatic preferred language detection via browser headers',
        'Test edge case translations and dynamic variable insertions'
      ]
    };
    
    if (taskMap[ticket]) {
        return taskMap[ticket].map(desc => ticket + ': ' + desc);
    }

    const title = story.includes(':') ? story.split(':')[1].trim() : story;
    return [
        (ticket ? ticket + ': ' : '') + 'Architect and design solution for: ' + title,
        (ticket ? ticket + ': ' : '') + 'Implement core functionality for: ' + title,
        (ticket ? ticket + ': ' : '') + 'Write comprehensive tests for: ' + title
    ];
}

mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 60000,
    connectTimeoutMS: 60000
}).then(async () => {
    console.log('Connected to DB. Starting cleanup and re-seed...');

    const startDate = new Date('2026-08-05T00:00:00Z');

    for (let userData of usersData) {
        console.log(`\n--- Processing User ${userData.userId} ---`);
        const employee = await User.findById(userData.userId);
        const employeeName = employee && employee.name ? employee.name : (employee ? employee.firstName + ' ' + employee.lastName : 'Unknown User');
        const company = employee ? employee.company : null;

        console.log("Cleaning up previously generated timelogs (Job='Development')...");
        await TimeLog.deleteMany({
            employee: userData.userId,
            date: { $gte: startDate },
            job: "Development" 
        });
        
        const trackers = await TimeTracker.find({
            user: userData.userId,
            date: { $gte: startDate }
        }).sort({ date: 1 });
        
        let subTasksList = [];
        for (let story of userData.stories) {
            subTasksList.push(...splitStoryIntoSubTasks(story));
        }

        console.log(`Found ${trackers.length} trackers and mapped to ${subTasksList.length} sub-tasks.`);
        
        let taskIndex = 0;
        
        for (const tracker of trackers) {
            if (tracker.status === 'Present' || (tracker.checkInTime && tracker.checkOutTime)) {
                let currentDay = new Date(tracker.date);
                
                let dailyTasks = [];
                for (let i = 0; i < 3; i++) {
                    if (taskIndex < subTasksList.length) {
                        dailyTasks.push(subTasksList[taskIndex]);
                        taskIndex++;
                    } else {
                        // Keep providing meaningful work tasks if we run out of sub-tasks
                        let fallbackTitle = "Final Integration and QA Fixes";
                        let part = (taskIndex - subTasksList.length) + 1;
                        dailyTasks.push(`${fallbackTitle} - Part ${part}`);
                        taskIndex++;
                    }
                }
                
                const startOfDay = new Date(currentDay);
                startOfDay.setUTCHours(0,0,0,0);
                const endOfDay = new Date(currentDay);
                endOfDay.setUTCHours(23,59,59,999);

                let timesheet = await Timesheet.findOne({ 
                    employee: userData.userId, 
                    date: { $gte: startOfDay, $lte: endOfDay } 
                });

                const tsName = employeeName !== 'undefined undefined' && employeeName !== 'Unknown User' ? 
                               "Timesheet - " + employeeName + " - " + currentDay.toISOString().split('T')[0] :
                               "Timesheet for " + currentDay.toISOString().split('T')[0];

                let actualNameToSet = employeeName !== 'undefined undefined' ? employeeName : "Software Engineer";

                if (!timesheet) {
                    timesheet = new Timesheet({
                        name: tsName,
                        description: "Development tasks",
                        employee: userData.userId,
                        employeeName: actualNameToSet,
                        company: company,
                        date: currentDay,
                        submittedHours: 8,
                        approvedHours: 8,
                        status: "Approved",
                        approvedBy: userData.approverId,
                        approver: userData.approverId,
                        timeLogs: []
                    });
                } else {
                    timesheet.name = tsName;
                    timesheet.employeeName = actualNameToSet; 
                    timesheet.status = "Approved";
                    timesheet.approvedHours = 8;
                    timesheet.submittedHours = 8;
                    timesheet.approvedBy = userData.approverId;
                    timesheet.approver = userData.approverId;
                    
                    const existingValidLogs = await TimeLog.find({ timesheet: timesheet._id });
                    timesheet.timeLogs = existingValidLogs.map(l => l._id);
                }

                await timesheet.save();

                const hoursArray = [3, 3, 2];
                let createdLogs = [];
                
                for (let i = 0; i < 3; i++) {
                    const timeLog = new TimeLog({
                        employee: userData.userId,
                        job: "Development",
                        company: company,
                        date: currentDay,
                        description: dailyTasks[i],
                        hours: hoursArray[i],
                        isAddedToTimesheet: true,
                        timesheet: timesheet._id
                    });
                    await timeLog.save();
                    createdLogs.push(timeLog._id);
                }

                if (createdLogs.length > 0) {
                    timesheet.timeLogs.push(...createdLogs);
                    await timesheet.save();
                }
            }
        }
    }

    console.log("Finished cleanup and re-seeding!");
    process.exit(0);

}).catch(e => {
    console.error(e);
    process.exit(1);
});
