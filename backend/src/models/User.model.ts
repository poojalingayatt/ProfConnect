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
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  profileCompleted: boolean;
  bio?: string;
  specialization?: string[];
  qualifications?: string[];
  officeLocation?: string;
  officeHours?: string; // Faculty: "Mon-Fri 2:00 PM - 4:00 PM"

  // Student-specific fields
  studentId?: string; // Student ID number
  skills?: string[]; // Student skills (e.g., React, Node.js)
  semester?: number; // Student semester (1-8)
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
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    profileCompleted: { type: Boolean, default: false },
    bio: { type: String },
    specialization: [{ type: String }],
    qualifications: [{ type: String }],
    officeLocation: { type: String },
    officeHours: { type: String },

    // Student-specific fields
    studentId: { type: String },
    skills: [{ type: String }],
    semester: { type: Number, min: 1, max: 8 }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export const UserModel = mongoose.model<IUser>("User", userSchema);
