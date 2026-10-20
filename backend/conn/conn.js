const mongoose = require("mongoose");

const conn = async () => {
  try {
    const mongoUri = process.env.NODE_ENV === "test"
      ? process.env.TEST_MONGODB_URI
      : process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error(
        process.env.NODE_ENV === "test"
          ? "TEST_MONGODB_URI is required when NODE_ENV=test"
          : "MONGODB_URI is required"
      );
    }

    await mongoose.connect(mongoUri);
    console.log("DataBase Connected Successfully!!");

    try {
      const activityLogsCol = mongoose.connection.collection("activitylogs");
      const indexes = await activityLogsCol.indexes();
      if (indexes.some((idx) => idx.name === "batchId_1_startTime_1")) {
        await activityLogsCol.dropIndex("batchId_1_startTime_1");
        console.log("Dropped obsolete index batchId_1_startTime_1 from activitylogs");
      }
    } catch {
      // Ignore if collection or index does not exist
    }

    try {
      const timesheetsCol = mongoose.connection.collection("timesheets");
      const indexes = await timesheetsCol.indexes();

      // Legacy single-field unique index on `date` (from an older schema).
      // It prevented more than one employee from submitting a timesheet on
      // the same day and produced "This date is already registered".
      const legacyDateIndex = indexes.find(
        (idx) =>
          idx.unique &&
          Object.keys(idx.key || {}).length === 1 &&
          idx.key.date === 1
      );
      if (legacyDateIndex) {
        await timesheetsCol.dropIndex(legacyDateIndex.name);
        console.log(`Dropped obsolete index ${legacyDateIndex.name} from timesheets`);
      }

      // Recreate the employee+date index with its partial filter if an
      // older non-partial unique version is still present.
      const employeeDateIndex = indexes.find(
        (idx) => idx.name === "employee_1_date_1"
      );
      if (
        employeeDateIndex &&
        employeeDateIndex.unique &&
        !employeeDateIndex.partialFilterExpression
      ) {
        await timesheetsCol.dropIndex(employeeDateIndex.name);
        console.log("Dropped obsolete index employee_1_date_1 from timesheets");
      }
    } catch {
      // Ignore if collection or index does not exist
    }
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

conn();
