import { Request, Response } from "express";
import { AvailabilityModel } from "../models/Availability.model";
import { success } from "../utils/apiResponse";

export async function getAvailability(req: Request, res: Response) {
  const facultyId = req.params.facultyId;
  const avail = await AvailabilityModel.findOne({ facultyId });
  return res.json(success(avail));
}

export async function updateMyAvailability(req: Request & { user?: any }, res: Response) {
  const uid = req.user._id;
  const { week } = req.body as any;
  const doc = await AvailabilityModel.findOneAndUpdate({ facultyId: uid }, { week }, { new: true, upsert: true });
  return res.json(success(doc));
}
