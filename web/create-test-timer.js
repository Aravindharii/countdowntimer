// Script to create a test timer in MongoDB
import mongoose from 'mongoose';
import Timer from './models/Timer.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify-countdown-timer';

async function createTestTimer() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get product ID from command line or use default
        const productId = process.argv[2] || 'gid://shopify/Product/9854064009522';
        const shopDomain = 'newstore-21092076.myshopify.com';

        // Check if timer already exists
        const existing = await Timer.findOne({ shopDomain, productId });
        if (existing) {
            console.log('Timer already exists:', existing);
            await mongoose.disconnect();
            return;
        }

        // Create a test timer that expires in 2 hours
        const timer = new Timer({
            shopDomain,
            productId,
            name: 'Test Flash Sale',
            startDate: new Date(),
            endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
            description: 'Limited time offer - Don\'t miss out!',
            settings: {
                color: '#ff0000',
                size: 'Medium',
                position: 'Top',
                urgencyTriggerMinutes: 30,
                urgencyNotificationType: 'Color pulse'
            },
            isActive: true
        });

        await timer.save();
        console.log('Test timer created successfully!');
        console.log('Timer details:', JSON.stringify(timer, null, 2));

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error creating test timer:', error);
        process.exit(1);
    }
}

createTestTimer();
