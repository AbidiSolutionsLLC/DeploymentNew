const mongoose = require("mongoose");
const dotenv = require("dotenv")

dotenv.config()

const conn = async () => {
  try {
    await mongoose.connect(
     process.env.MONGODB_URI)
    console.log("DataBase Connected Successfully!!");
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

conn();
