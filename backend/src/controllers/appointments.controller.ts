import { Request, Response } from "express";
import { AppointmentModel } from "../models/Appointment.model";
import { success, failure } from "../utils/apiResponse";
import { NotificationModel } from "../models/Notification.model";

async function isOverlap(facultyId: any, date: Date, startTime: string, endTime: string, excludeId?: any) {
  const q: any = { facultyId, date };
  if (excludeId) q._id = { $ne: excludeId };
  const appts = await AppointmentModel.find(q).where("status").ne("cancelled");
  for (const a of appts) {
    const s1 = a.startTime; const e1 = a.endTime;
    if (!(endTime <= s1 || startTime >= e1)) return true;
  }
  return false;
}

export async function createAppointment(req: Request & { user?: any }, res: Response) {
  const { facultyId, title, date, startTime, endTime, durationMinutes, location, description } = req.body as any;
  if (await isOverlap(facultyId, new Date(date), startTime, endTime)) return res.status(400).json(failure("Time slot not available"));
  const appt = await AppointmentModel.create({ studentId: req.user._id, facultyId, title, date, startTime, endTime, durationMinutes, location, description });
  await NotificationModel.create({ userId: facultyId, type: "appointment_request", message: `New appointment request from ${req.user.name}` });
  return res.json(success(appt));
}

export async function getMyAppointments(req: Request & { user?: any }, res: Response) {
  const user = req.user;
  const filter: any = {};
  if (user.role === "student") filter.studentId = user._id;
  if (user.role === "faculty") filter.facultyId = user._id;
  const list = await AppointmentModel.find(filter).sort({ date: -1 });
  return res.json(success(list));
}

export async function getAppointmentById(req: Request & { user?: any }, res: Response) {
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) return res.status(404).json(failure("Not found"));
  const user = req.user;
  if (user.role === "student" && !appt.studentId.equals(user._id)) return res.status(403).json(failure("Forbidden"));
  if (user.role === "faculty" && !appt.facultyId.equals(user._id)) return res.status(403).json(failure("Forbidden"));
  return res.json(success(appt));
}

export async function acceptAppointment(req: Request & { user?: any }, res: Response) {
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) return res.status(404).json(failure("Not found"));
  if (!appt.facultyId.equals(req.user._id)) return res.status(403).json(failure("Forbidden"));
  if (await isOverlap(appt.facultyId, appt.date, appt.startTime, appt.endTime, appt._id)) return res.status(400).json(failure("Time conflict"));
  appt.status = "accepted";
  await appt.save();
  await NotificationModel.create({ userId: appt.studentId, type: "appointment_accepted", message: `Your appointment was accepted` });
  return res.json(success(appt));
}

export async function rejectAppointment(req: Request & { user?: any }, res: Response) {
  const { message } = req.body as any;
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) return res.status(404).json(failure("Not found"));
  if (!appt.facultyId.equals(req.user._id)) return res.status(403).json(failure("Forbidden"));
  appt.status = "rejected";
  appt.facultyResponseMessage = message;
  await appt.save();
  await NotificationModel.create({ userId: appt.studentId, type: "appointment_rejected", message: `Your appointment was rejected` });
  return res.json(success(appt));
}

export async function rescheduleAppointment(req: Request & { user?: any }, res: Response) {
  const { date, startTime, endTime } = req.body as any;
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) return res.status(404).json(failure("Not found"));
  if (!appt.facultyId.equals(req.user._id)) return res.status(403).json(failure("Forbidden"));
  if (await isOverlap(appt.facultyId, new Date(date), startTime, endTime, appt._id)) return res.status(400).json(failure("Time conflict"));
  appt.rescheduleFrom = { date: appt.date, startTime: appt.startTime, endTime: appt.endTime };
  appt.date = new Date(date);
  appt.startTime = startTime;
  appt.endTime = endTime;
  appt.status = "pending";
  await appt.save();
  await NotificationModel.create({ userId: appt.studentId, type: "appointment_rescheduled", message: `Appointment rescheduled by faculty` });
  return res.json(success(appt));
}

export async function cancelAppointment(req: Request & { user?: any }, res: Response) {
  const { reason } = req.body as any;
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) return res.status(404).json(failure("Not found"));
  const user = req.user;
  if (user.role === "student" && !appt.studentId.equals(user._id)) return res.status(403).json(failure("Forbidden"));
  if (user.role === "faculty" && !appt.facultyId.equals(user._id)) return res.status(403).json(failure("Forbidden"));
  appt.status = "cancelled";
  appt.cancelReason = reason;
  await appt.save();
  await NotificationModel.create({ userId: user.role === "student" ? appt.facultyId : appt.studentId, type: "appointment_cancelled", message: `Appointment cancelled` });
  return res.json(success(appt));
}

export async function completeAppointment(req: Request & { user?: any }, res: Response) {
  const appt = await AppointmentModel.findById(req.params.id);
  if (!appt) return res.status(404).json(failure("Not found"));
  if (!appt.facultyId.equals(req.user._id)) return res.status(403).json(failure("Forbidden"));
  appt.status = "completed";
  await appt.save();
  await NotificationModel.create({ userId: appt.studentId, type: "appointment_completed", message: `Appointment marked completed` });
  return res.json(success(appt));
}
