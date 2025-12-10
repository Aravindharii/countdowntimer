import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/countdown-timer";

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
    console.log("Continuing without MongoDB - using mock data only");
  }
};

export default connectDB;