import { Request, Response, NextFunction } from "express";

export function roleMiddleware(roles: string[]) {
  return (req: Request & { user?: any }, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!roles.includes(user.role)) return res.status(403).json({ success: false, message: "Forbidden" });
    next();
  };
}
