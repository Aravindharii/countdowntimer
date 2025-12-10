import mongoose from "mongoose";
import Timer from "./models/Timer.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/countdown-timer";

const verifyDB = async () => {
    try {
        console.log(`Attempting to connect to ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
        console.log("MongoDB Connected Successfully.");

        // Create a test timer
        const testTimer = new Timer({
            shopDomain: "test-verification.myshopify.com",
            productId: "verify-123",
            name: "Verification Timer",
            startDate: new Date(),
            endDate: new Date(Date.now() + 3600000), // 1 hour later
            description: "Testing DB Persistence",
            settings: {
                color: "#00ff00",
                size: "Medium",
                position: "Top",
                urgencyTriggerMinutes: 10,
                urgencyNotificationType: "Color pulse"
            }
        });

        const savedTimer = await testTimer.save();
        console.log("Timer saved successfully:", savedTimer._id);

        // Verify retrieval
        const foundTimer = await Timer.findById(savedTimer._id);
        if (foundTimer) {
            console.log("Timer retrieved successfully:", foundTimer.name);
        } else {
            console.error("Failed to retrieve saved timer.");
        }

        // Clean up
        await Timer.deleteOne({ _id: savedTimer._id });
        console.log("Test timer cleaned up.");

        process.exit(0);
    } catch (error) {
        console.error("MongoDB Verification Failed:", error);
        process.exit(1);
    }
};

verifyDB();
