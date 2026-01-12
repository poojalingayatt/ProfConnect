import { Request, Response } from "express";
import { UserModel } from "../models/User.model";
import { FacultyProfileModel } from "../models/FacultyProfile.model";
import { FollowModel } from "../models/Follow.model";
import { success } from "../utils/apiResponse";

export async function listFaculty(req: Request, res: Response) {
  const { department, specialization, q } = req.query as any;
  const filter: any = { role: "faculty" };
  if (department) filter.department = department;
  if (q) filter.$or = [{ name: new RegExp(q, "i") }, { email: new RegExp(q, "i") }];
  const users = await UserModel.find(filter).select("-passwordHash");
  const userIds = users.map((u) => u._id);
  const profiles = await FacultyProfileModel.find({ userId: { $in: userIds } });

  // Get follower counts for each faculty
  const followerCounts = await Promise.all(
    userIds.map(async (id) => ({
      userId: id,
      count: await FollowModel.countDocuments({ facultyId: id })
    }))
  );

  const facultyList = users.map(user => {
    const profile = profiles.find(p => p.userId.toString() === user._id.toString());
    const followerData = followerCounts.find(f => f.userId.toString() === user._id.toString());
    return {
      ...user.toObject(),
      profile,
      followerCount: followerData?.count || 0
    };
  });

  return res.json(success(facultyList));
}

export async function getFaculty(req: Request, res: Response) {
  const id = req.params.facultyId;
  const user = await UserModel.findById(id).select("-passwordHash");
  const profile = await FacultyProfileModel.findOne({ userId: id });
  const followerCount = await FollowModel.countDocuments({ facultyId: id });
  return res.json(success({ user, profile, followerCount }));
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
