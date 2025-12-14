import { Request, Response } from "express";
import { UserModel } from "../models/User.model";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { success, failure } from "../utils/apiResponse";

export async function register(req: Request, res: Response) {
  const { name, email, password, role } = req.body as any;
  const exists = await UserModel.findOne({ email });
  if (exists) return res.status(400).json(failure("Email already registered"));
  const passwordHash = await hashPassword(password);
  const user = await UserModel.create({ name, email, passwordHash, role: role || "student" });
  const token = signToken({ id: user._id, role: user.role });
  return res.json(success({ accessToken: token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }));
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as any;
  const user = await UserModel.findOne({ email });
  if (!user) return res.status(400).json(failure("Invalid credentials"));
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(400).json(failure("Invalid credentials"));
  const token = signToken({ id: user._id, role: user.role });
  return res.json(success({ accessToken: token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }));
}

export async function me(req: Request & { user?: any }, res: Response) {
  const user = req.user;
  return res.json(success(user));
}
