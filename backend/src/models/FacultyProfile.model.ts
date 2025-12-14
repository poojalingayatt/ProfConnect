import mongoose from "mongoose";

export interface IFacultyProfile extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  bio?: string;
  qualifications: string[];
  specializations: string[];
  officeLocation?: string;
  currentLocation?: string;
  isOnline: boolean;
  ratingAvg: number;
  reviewCount: number;
}

const facultySchema = new mongoose.Schema<IFacultyProfile>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    bio: { type: String },
    qualifications: { type: [String], default: [] },
    specializations: { type: [String], default: [] },
    officeLocation: { type: String },
    currentLocation: { type: String },
    isOnline: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

facultySchema.index({ userId: 1 });

export const FacultyProfileModel = mongoose.model<IFacultyProfile>("FacultyProfile", facultySchema);
