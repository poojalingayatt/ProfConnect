import mongoose from "mongoose";
import { connectDB } from "./config/db";

async function checkUsers() {
    try {
        await connectDB();

        const users = await mongoose.connection.db.collection('users').find({}).toArray();

        console.log(`\n📊 Found ${users.length} user(s) in database:\n`);

        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Name: ${user.name}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Email Verified: ${user.emailVerified}`);
            console.log(`  Profile Completed: ${user.profileCompleted}`);
            console.log(`  Verification Token: ${user.emailVerificationToken ? 'EXISTS' : 'NONE'}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Error checking database:", error);
        process.exit(1);
    }
}

checkUsers();
