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
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

conn();
