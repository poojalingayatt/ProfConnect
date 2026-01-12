import mongoose from "mongoose";

export type AppointmentStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";

export interface IAppointment extends mongoose.Document {
  studentId: mongoose.Types.ObjectId;
  facultyId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  date: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  location?: string;
  status: AppointmentStatus;
  notes?: string;
  facultyResponseMessage?: string;
  cancelReason?: string;
  rescheduleFrom?: any;
}

const appointmentSchema = new mongoose.Schema<IAppointment>(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    location: { type: String },
    status: { type: String, enum: ["pending", "accepted", "rejected", "cancelled", "completed"], default: "pending" },
    notes: { type: String },
    facultyResponseMessage: { type: String },
    cancelReason: { type: String },
    rescheduleFrom: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

// We'll enforce double-booking prevention in code rather than a partial unique index.
appointmentSchema.index({ facultyId: 1, date: 1, startTime: 1 });

export const AppointmentModel = mongoose.model<IAppointment>("Appointment", appointmentSchema);
