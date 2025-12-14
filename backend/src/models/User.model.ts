import mongoose from "mongoose";

export type Role = "student" | "faculty" | "admin";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  department?: string;
  avatarUrl?: string;
  phone?: string;
  isActive: boolean;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "faculty", "admin"], default: "student" },
    department: { type: String },
    avatarUrl: { type: String },
    phone: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const UserModel = mongoose.model<IUser>("User", userSchema);
