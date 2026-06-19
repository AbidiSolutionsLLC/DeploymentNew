if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

require("./conn/conn");
const CronJobs = require('./cronjobs');

console.log("Starting standalone Cron Worker...");
new CronJobs();

process.on('SIGINT', async () => {
  console.log('Shutting down cron worker...');
  process.exit(0);
});
