import mongoose from "mongoose";
import Timer from "./models/Timer.js";
import dotenv from "dotenv";

dotenv.config();

const SHOP_DOMAIN = "newstore-21092076.myshopify.com";

// All product IDs from the screenshot and previous logs
const PRODUCT_IDS = [
    "8847705637092", // Biodegradable cardboard pots
    "8847704916196", // Clay Plant Pot
    "8847704785124", // Antique Drawers
    "8847704817892", // Redusic Table
    "8847704850660", // Black Beanbag
];

async function createAllTimers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/countdown-timer");
        console.log("Connected to MongoDB\n");

        // Clear all existing timers
        await Timer.deleteMany({});
        console.log("Cleared all existing timers\n");

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7); // 7 days from now

        const timerPromises = PRODUCT_IDS.map(async (productId) => {
            const timer = new Timer({
                shopDomain: SHOP_DOMAIN,
                productId: productId,
                name: "Flash Sale",
                startDate: startDate,
                endDate: endDate,
                description: "Limited Time Offer - Don't Miss Out!",
                settings: {
                    color: "#FF4500", // Orange-red
                    size: "Large",
                    position: "Below Add to Cart",
                    urgencyTriggerMinutes: 120,
                    urgencyNotificationType: "Color pulse",
                    fontSize: "18px"
                },
                isActive: true
            });

            await timer.save();
            return timer;
        });

        const timers = await Promise.all(timerPromises);

        console.log(`✅ Created ${timers.length} timers successfully!\n`);
        console.log("--------------------------------");
        timers.forEach((timer, index) => {
            console.log(`Timer ${index + 1}:`);
            console.log(`  Product ID: ${timer.productId}`);
            console.log(`  Timer ID: ${timer._id}`);
            console.log(`  Active: ${timer.isActive}`);
            console.log("");
        });
        console.log("--------------------------------");
        console.log(`All timers expire on: ${endDate.toISOString()}`);
        console.log("--------------------------------\n");

    } catch (error) {
        console.error("Error creating timers:", error);
    } finally {
        await mongoose.disconnect();
    }
}

createAllTimers();
