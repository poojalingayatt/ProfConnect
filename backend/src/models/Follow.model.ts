import mongoose from "mongoose";

export interface IFollow extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
}

const followSchema = new mongoose.Schema<IFollow>(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

followSchema.index({ studentId: 1, facultyId: 1 }, { unique: true });

export const FollowModel = mongoose.model<IFollow>("Follow", followSchema);
