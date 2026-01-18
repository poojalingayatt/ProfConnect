import mongoose from "mongoose";
import { connectDB } from "./config/db";

async function verifyEmail(email: string) {
    try {
        await connectDB();

        const result = await mongoose.connection.db.collection('users').updateOne(
            { email },
            {
                $set: {
                    emailVerified: true,
                    emailVerificationToken: undefined,
                    emailVerificationExpires: undefined
                }
            }
        );

        if (result.matchedCount > 0) {
            console.log(`✅ Email verified successfully for: ${email}`);
            console.log(`   You can now login with this account!`);
        } else {
            console.log(`❌ No user found with email: ${email}`);
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Error verifying email:", error);
        process.exit(1);
    }
}

// Get email from command line argument or use default
const email = process.argv[2] || "09poojalingayat@gmail.com";
verifyEmail(email);
