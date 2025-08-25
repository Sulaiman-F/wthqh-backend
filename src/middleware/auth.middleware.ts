import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/generateToken";

export interface AuthRequest extends Request {
  user?: { userId: string; role: "admin" | "member" };
}

export function authorized(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    const token = authHeader.split(" ")[1];
    const payload = verifyToken(token);
    req.user = {
      userId: payload.userId,
      role: payload.role as "admin" | "member",
    };
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

export function restrictTo(...roles: Array<"admin" | "member">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    next();
  };
}
