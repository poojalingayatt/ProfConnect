import { Request, Response } from "express";
import { FollowModel } from "../models/Follow.model";
import { UserModel } from "../models/User.model";
import { FacultyProfileModel } from "../models/FacultyProfile.model";
import { NotificationModel } from "../models/Notification.model";
import { success, failure } from "../utils/apiResponse";

export async function followFaculty(req: Request & { user?: any }, res: Response) {
  const studentId = req.user._id;
  const facultyId = req.params.facultyId;
  try {
    const f = await FollowModel.create({ studentId, facultyId });
    await NotificationModel.create({ userId: facultyId, type: "follow", message: `${req.user.name} started following you` });
    return res.json(success(f));
  } catch (err) {
    return res.status(400).json(failure("Already following or invalid"));
  }
}

export async function unfollowFaculty(req: Request & { user?: any }, res: Response) {
  const studentId = req.user._id;
  const facultyId = req.params.facultyId;
  await FollowModel.deleteOne({ studentId, facultyId });
  return res.json(success(true));
}

export async function getMyFollows(req: Request & { user?: any }, res: Response) {
  const studentId = req.user._id;
  const follows = await FollowModel.find({ studentId }).populate("facultyId", "-passwordHash");

  // Get faculty profiles for followed faculty
  const facultyIds = follows.map(f => (f.facultyId as any)._id);
  const profiles = await FacultyProfileModel.find({ userId: { $in: facultyIds } });

  const result = follows.map(follow => ({
    ...follow.toObject(),
    profile: profiles.find(p => p.userId.toString() === (follow.facultyId as any)._id.toString())
  }));

  return res.json(success(result));
}

export async function getFollowers(req: Request & { user?: any }, res: Response) {
  const facultyId = req.user._id;
  const followers = await FollowModel.find({ facultyId }).populate("studentId", "-passwordHash");
  return res.json(success(followers));
}

export async function checkFollowing(req: Request & { user?: any }, res: Response) {
  const studentId = req.user._id;
  const facultyId = req.params.facultyId;
  const exists = await FollowModel.exists({ studentId, facultyId });
  return res.json(success({ isFollowing: !!exists }));
}
