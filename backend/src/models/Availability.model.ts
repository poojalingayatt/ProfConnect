import mongoose from "mongoose";

type Slot = { start: string; end: string };
type Break = { start: string; end: string; label?: string };

export interface IAvailability extends mongoose.Document {
  facultyId: mongoose.Types.ObjectId;
  week: Array<{ day: number; slots: Slot[]; breaks: Break[] }>;
}

const availabilitySchema = new mongoose.Schema<IAvailability>(
  {
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    week: {
      type: [
        {
          day: Number,
          slots: [{ start: String, end: String }],
          breaks: [{ start: String, end: String, label: String }]
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

availabilitySchema.index({ facultyId: 1 });

export const AvailabilityModel = mongoose.model<IAvailability>("Availability", availabilitySchema);
