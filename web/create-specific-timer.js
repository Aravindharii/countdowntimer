
import mongoose from "mongoose";
import Timer from "./models/Timer.js";
import dotenv from "dotenv";

dotenv.config();

const SHOP_DOMAIN = "newstore-21092076.myshopify.com";
const PRODUCT_ID = process.argv[2] || "47161602834660"; // Default to the one from user request

async function createTimer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/countdown-timer");
        console.log("Connected to MongoDB");

        // Clean up existing timers for this product to avoid confusion
        await Timer.deleteMany({ productId: { $regex: PRODUCT_ID } });
        console.log(`Cleared existing timers for ${PRODUCT_ID}`);

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 5); // 5 days from now

        const timer = new Timer({
            shopDomain: SHOP_DOMAIN,
            productId: PRODUCT_ID,
            name: "Clay Plant Pot Sale",
            startDate: startDate,
            endDate: endDate,
            description: "Special Offer on Clay Pots!",
            settings: {
                color: "#2E8B57", // Seagreen
                size: "Large",
                position: "Below Add to Cart",
                urgencyTriggerMinutes: 120,
                urgencyNotificationType: "Bar",
                fontSize: "18px"
            },
            isActive: true
        });

        await timer.save();

        console.log("\n✅ Timer Created Successfully!");
        console.log("--------------------------------");
        console.log("ID:", timer._id);
        console.log("Shop:", timer.shopDomain);
        console.log("Product ID:", timer.productId);
        console.log("Start:", timer.startDate);
        console.log("End:", timer.endDate);
        console.log("Active:", timer.isActive);
        console.log("--------------------------------\n");

    } catch (error) {
        console.error("Error creating timer:", error);
    } finally {
        await mongoose.disconnect();
    }
}

createTimer();
