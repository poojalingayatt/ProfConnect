import { Request, Response } from "express";
import { NotificationModel } from "../models/Notification.model";
import { success } from "../utils/apiResponse";

export async function getMyNotifications(req: Request & { user?: any }, res: Response) {
  const list = await NotificationModel.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return res.json(success(list));
}

export async function markRead(req: Request & { user?: any }, res: Response) {
  await NotificationModel.updateOne({ _id: req.params.id, userId: req.user._id }, { read: true });
  return res.json(success(true));
}

export async function markReadAll(req: Request & { user?: any }, res: Response) {
  await NotificationModel.updateMany({ userId: req.user._id }, { read: true });
  return res.json(success(true));
}

export async function deleteNotification(req: Request & { user?: any }, res: Response) {
  await NotificationModel.deleteOne({ _id: req.params.id, userId: req.user._id });
  return res.json(success(true));
}
