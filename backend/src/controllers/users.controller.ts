import { Request, Response } from "express";
import { UserModel } from "../models/User.model";
import { success } from "../utils/apiResponse";

export async function getUsers(req: Request, res: Response) {
  const users = await UserModel.find().select("-passwordHash");
  return res.json(success(users));
}

export async function getUserById(req: Request, res: Response) {
  const user = await UserModel.findById(req.params.id).select("-passwordHash");
  return res.json(success(user));
}
