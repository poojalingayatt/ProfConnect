import jwt from "jsonwebtoken";
import { JWT_ACCESS_SECRET, JWT_ACCESS_EXPIRES_IN } from "../config/env";

export function signToken(payload: object) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN });
}

export function verifyToken<T = any>(token: string) {
  return jwt.verify(token, JWT_ACCESS_SECRET) as T;
}
