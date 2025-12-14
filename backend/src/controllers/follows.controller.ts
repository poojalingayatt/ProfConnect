import { Request, Response } from "express";
import { FollowModel } from "../models/Follow.model";
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
  const list = await FollowModel.find({ studentId });
  return res.json(success(list));
}

export async function getFollowers(req: Request & { user?: any }, res: Response) {
  const facultyId = req.user._id;
  const list = await FollowModel.find({ facultyId });
  return res.json(success(list));
}
