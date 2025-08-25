import jwt, { Secret, SignOptions } from "jsonwebtoken";

export function generateToken(userId: string, role: string) {
  const secret = process.env.JWT_SECRET as string;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign({ userId, role }, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  const secret = process.env.JWT_SECRET as string;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.verify(token, secret) as { userId: string; role: string };
}

// Access/Refresh tokens (returned in response body; no cookies)
export function generateAccessToken(userId: string, role: string) {
  const accessSecret: Secret = (process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET) as string;
  if (!accessSecret) throw new Error("JWT_ACCESS_SECRET/JWT_SECRET is not set");
  const accessExpSec: number = Number(
    process.env.JWT_ACCESS_EXPIRES_SEC || 900
  ); // 15m
  const opts: SignOptions = { expiresIn: accessExpSec };
  return jwt.sign({ userId, role }, accessSecret, opts);
}

export function verifyAccessToken(token: string) {
  const accessSecret: Secret = (process.env.JWT_ACCESS_SECRET ||
    process.env.JWT_SECRET) as string;
  if (!accessSecret) throw new Error("JWT_ACCESS_SECRET/JWT_SECRET is not set");
  return jwt.verify(token, accessSecret) as { userId: string; role: string };
}

export function generateRefreshToken(userId: string, role: string) {
  const refreshSecret: Secret = (process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET) as string;
  if (!refreshSecret)
    throw new Error("JWT_REFRESH_SECRET/JWT_SECRET is not set");
  const refreshExpSec: number = Number(
    process.env.JWT_REFRESH_EXPIRES_SEC || 2592000
  ); // 30d
  const opts: SignOptions = { expiresIn: refreshExpSec };
  return jwt.sign({ userId, role, type: "refresh" }, refreshSecret, opts);
}

export function verifyRefreshToken(token: string) {
  const refreshSecret: Secret = (process.env.JWT_REFRESH_SECRET ||
    process.env.JWT_SECRET) as string;
  if (!refreshSecret)
    throw new Error("JWT_REFRESH_SECRET/JWT_SECRET is not set");
  return jwt.verify(token, refreshSecret) as {
    userId: string;
    role: string;
    type?: string;
  };
}
