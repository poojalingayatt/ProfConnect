import { Request, Response } from "express";
import { UserModel } from "../models/User.model";
import { FacultyProfileModel } from "../models/FacultyProfile.model";
import { success } from "../utils/apiResponse";

export async function listFaculty(req: Request, res: Response) {
  const { department, specialization, q } = req.query as any;
  const filter: any = { role: "faculty" };
  if (department) filter.department = department;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
  const users = await UserModel.find(filter).select("-passwordHash");
  const profiles = await FacultyProfileModel.find({ userId: { $in: users.map((u) => u._id) } });
  return res.json(success({ users, profiles }));
}

export async function getFaculty(req: Request, res: Response) {
  const id = req.params.facultyId;
  const user = await UserModel.findById(id).select("-passwordHash");
  const profile = await FacultyProfileModel.findOne({ userId: id });
  return res.json(success({ user, profile }));
}

export async function updateMyProfile(req: Request & { user?: any }, res: Response) {
  const uid = req.user._id;
  const body = req.body;
  let profile = await FacultyProfileModel.findOneAndUpdate({ userId: uid }, body, { new: true, upsert: true });
  return res.json(success(profile));
}

export async function updateStatus(req: Request & { user?: any }, res: Response) {
  const uid = req.user._id;
  const { isOnline, currentLocation } = req.body as any;
  const profile = await FacultyProfileModel.findOneAndUpdate({ userId: uid }, { isOnline, currentLocation }, { new: true, upsert: true });
  return res.json(success(profile));
}
