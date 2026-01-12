import { Request, Response } from "express";
import { UserModel } from "../models/User.model";
import { FacultyProfileModel } from "../models/FacultyProfile.model";
import { AppointmentModel } from "../models/Appointment.model";
import { FollowModel } from "../models/Follow.model";
import { success, failure } from "../utils/apiResponse";
import { hashPassword, comparePassword } from "../utils/password";

export async function getUsers(req: Request, res: Response) {
  const users = await UserModel.find().select("-passwordHash");
  return res.json(success(users));
}

export async function getUserById(req: Request, res: Response) {
  const user = await UserModel.findById(req.params.id).select("-passwordHash");
  return res.json(success(user));
}

export async function updateProfile(req: Request & { user?: any }, res: Response) {
  const { name, phone, department, avatarUrl } = req.body as any;
  const user = await UserModel.findByIdAndUpdate(
    req.user._id,
    { name, phone, department, avatarUrl },
    { new: true, runValidators: true }
  ).select("-passwordHash");
  return res.json(success(user));
}

export async function changePassword(req: Request & { user?: any }, res: Response) {
  const { currentPassword, newPassword } = req.body as any;
  const user = await UserModel.findById(req.user._id);
  if (!user) return res.status(404).json(failure("User not found"));

  const isValid = await comparePassword(currentPassword, user.passwordHash);
  if (!isValid) return res.status(400).json(failure("Current password is incorrect"));

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return res.json(success({ message: "Password changed successfully" }));
}

export async function getMyStats(req: Request & { user?: any }, res: Response) {
  const userId = req.user._id;
  const role = req.user.role;

  if (role === "student") {
    const totalAppointments = await AppointmentModel.countDocuments({ studentId: userId });
    const upcomingAppointments = await AppointmentModel.countDocuments({
      studentId: userId,
      status: "accepted",
      date: { $gte: new Date() }
    });
    const followedFaculty = await FollowModel.countDocuments({ studentId: userId });

    return res.json(success({
      totalAppointments,
      upcomingAppointments,
      followedFaculty
    }));
  } else if (role === "faculty") {
    const totalAppointments = await AppointmentModel.countDocuments({ facultyId: userId });
    const pendingRequests = await AppointmentModel.countDocuments({
      facultyId: userId,
      status: "pending"
    });
    const followers = await FollowModel.countDocuments({ facultyId: userId });

    return res.json(success({
      totalAppointments,
      pendingRequests,
      followers
    }));
  }

  return res.json(success({}));
}
