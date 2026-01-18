import nodemailer from "nodemailer";
import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FRONTEND_URL, NODE_ENV } from "../config/env";
import { emailTemplates } from "./email.templates";

// Create transporter
let transporter: nodemailer.Transporter;

async function createTransporter() {
    if (NODE_ENV === "development" && (!SMTP_USER || !SMTP_PASS)) {
        // Create test account using Ethereal
        const testAccount = await nodemailer.createTestAccount();
        console.log("📧 Using Ethereal test account:");
        console.log("   Email:", testAccount.user);
        console.log("   Password:", testAccount.pass);

        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    } else {
        transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: SMTP_PORT,
            secure: SMTP_PORT === 465,
            auth: {
                user: SMTP_USER,
                pass: SMTP_PASS,
            },
        });
    }
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
    if (!transporter) await createTransporter();

    const verificationUrl = `${FRONTEND_URL}/verify-email/${token}`;

    const info = await transporter.sendMail({
        from: '"ProfConnect" <noreply@profconnect.com>',
        to: email,
        subject: "Verify Your Email - ProfConnect",
        html: emailTemplates.verification(name, verificationUrl),
    });

    if (NODE_ENV === "development") {
        console.log("📧 Verification email sent!");
        console.log("   Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
    if (!transporter) await createTransporter();

    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;

    const info = await transporter.sendMail({
        from: '"ProfConnect" <noreply@profconnect.com>',
        to: email,
        subject: "Reset Your Password - ProfConnect",
        html: emailTemplates.passwordReset(name, resetUrl),
    });

    if (NODE_ENV === "development") {
        console.log("📧 Password reset email sent!");
        console.log("   Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return info;
}
