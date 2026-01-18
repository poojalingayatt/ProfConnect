import { Request, Response } from "express";
import crypto from "crypto";
import { UserModel } from "../models/User.model";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { success, failure } from "../utils/apiResponse";
import { sendVerificationEmail, sendPasswordResetEmail } from "../services/email.service";

export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body as any;
  const exists = await UserModel.findOne({ email });
  if (exists) return res.status(400).json(failure("Email already registered"));

  const passwordHash = await hashPassword(password);
  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await UserModel.create({
    name,
    email,
    passwordHash,
    role: role || "student",
    emailVerificationToken,
    emailVerificationExpires
  });

  // Send verification email
  await sendVerificationEmail(user.email, user.name, emailVerificationToken);

  return res.json(success({
    message: "Registration successful! Please check your email to verify your account.",
    email: user.email
  }));
}

export async function verifyEmail(req: Request, res: Response) {
  const { token } = req.params;

  const user = await UserModel.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json(failure("Invalid or expired verification token"));
  }

  user.emailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  return res.json(success({ message: "Email verified successfully! You can now log in." }));
}

export async function resendVerification(req: Request, res: Response) {
  const { email } = req.body as any;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(400).json(failure("User not found"));
  }

  if (user.emailVerified) {
    return res.status(400).json(failure("Email is already verified"));
  }

  const emailVerificationToken = crypto.randomBytes(32).toString("hex");
  const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpires = emailVerificationExpires;
  await user.save();

  await sendVerificationEmail(user.email, user.name, emailVerificationToken);

  return res.json(success({ message: "Verification email sent! Please check your inbox." }));
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as any;
  const user = await UserModel.findOne({ email });
  if (!user) return res.status(400).json(failure("Invalid credentials"));

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(400).json(failure("Invalid credentials"));

  if (!user.emailVerified) {
    return res.status(400).json(failure("Please verify your email before logging in", {
      requiresVerification: true
    }));
  }

  const token = signToken({ id: user._id, role: user.role });
  return res.json(success({
    accessToken: token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted
    }
  }));
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = req.body as any;

  const user = await UserModel.findOne({ email });
  if (!user) {
    // Don't reveal if user exists or not
    return res.json(success({ message: "If an account exists with this email, a password reset link has been sent." }));
  }

  const passwordResetToken = crypto.randomBytes(32).toString("hex");
  const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.passwordResetToken = passwordResetToken;
  user.passwordResetExpires = passwordResetExpires;
  await user.save();

  await sendPasswordResetEmail(user.email, user.name, passwordResetToken);

  return res.json(success({ message: "If an account exists with this email, a password reset link has been sent." }));
}

export async function resetPassword(req: Request, res: Response) {
  const { token } = req.params;
  const { password } = req.body as any;

  const user = await UserModel.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(400).json(failure("Invalid or expired reset token"));
  }

  const passwordHash = await hashPassword(password);
  user.passwordHash = passwordHash;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return res.json(success({ message: "Password reset successful! You can now log in with your new password." }));
}

export async function me(req: Request & { user?: any }, res: Response) {
  const user = req.user;
  return res.json(success(user));
}

export async function checkProfileStatus(req: Request & { user?: any }, res: Response) {
  const userId = req.user?.id;
  const user = await UserModel.findById(userId);

  if (!user) {
    return res.status(404).json(failure("User not found"));
  }

  return res.json(success({
    profileCompleted: user.profileCompleted,
    role: user.role
  }));
}
