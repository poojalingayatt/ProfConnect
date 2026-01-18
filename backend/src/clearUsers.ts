import mongoose from "mongoose";
import { connectDB } from "./config/db";

async function clearUsers() {
    try {
        await connectDB();

        // Clear all users
        const result = await mongoose.connection.db.collection('users').deleteMany({});
        console.log(`✅ Cleared ${result.deletedCount} users from database`);

        process.exit(0);
    } catch (error) {
        console.error("❌ Error clearing database:", error);
        process.exit(1);
    }
}

clearUsers();
