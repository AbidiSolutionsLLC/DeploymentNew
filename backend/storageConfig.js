// storageConfig.js
const { containerClient } = require('./config/azureConfig');
const AzureBlobStorage = require('./utils/azureMulterStorage');

// Helper to create storage with specific folder
const createStorage = (folderName) => {
  return AzureBlobStorage({
    containerClient,
    params: {
      folder: folderName,
    }
  });
};

// User profile photos storage
const userProfileStorage = createStorage("abidiPro/users/profile_photos");

// TimeLogs attachments storage
const timeLogsStorage = createStorage("abidiPro/timeLogs/attachments");

// Timesheets attachments storage
const timesheetsStorage = createStorage("abidiPro/timesheets/attachments");

// Tickets attachments storage
const ticketsAttachmentsStorage = createStorage("abidiPro/tickets/attachments");

// Tasks attachments storage
const tasksStorage = createStorage("abidiPro/tasks/attachments");

// Expenses attachments storage
const expensesStorage = createStorage("abidiPro/expenses/receipts");

// Main file storage
const fileStorage = createStorage("abidiPro/files");

// Folder thumbnail storage
const folderStorage = createStorage("abidiPro/folders/thumbnails");

module.exports = {
  fileStorage,
  folderStorage,
  userProfileStorage,
  timeLogsStorage,
  timesheetsStorage,
  ticketsAttachmentsStorage,
  tasksStorage,
  expensesStorage
};
