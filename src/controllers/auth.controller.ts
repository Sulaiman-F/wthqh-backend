import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyRefreshToken,
} from "../utils/generateToken";

export async function signup(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res
        .status(409)
        .json({ success: false, message: "Email already exists" });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hash,
      role: role === "admin" ? "admin" : "member",
    });
    const userId = (user as any)._id.toString();
    const accessToken = generateAccessToken(userId, user.role);
    const refreshToken = generateRefreshToken(userId, user.role);
    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: userId, name: user.name, email: user.email, role: user.role },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function signin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    const userId = (user as any)._id.toString();
    const accessToken = generateAccessToken(userId, user.role);
    const refreshToken = generateRefreshToken(userId, user.role);
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: userId, name: user.name, email: user.email, role: user.role },
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body as { refreshToken?: string };
    if (!refreshToken)
      return res
        .status(400)
        .json({ success: false, message: "Missing refreshToken" });
    const payload = verifyRefreshToken(refreshToken);
    if (payload.type && payload.type !== "refresh")
      return res
        .status(401)
        .json({ success: false, message: "Invalid token type" });
    const accessToken = generateAccessToken(payload.userId, payload.role);
    res.json({ success: true, accessToken });
  } catch (e: any) {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
}

export async function logout(_req: Request, res: Response) {
  // Stateless: client deletes tokens; optionally blacklist on server if you add storage
  res.status(204).send();
}

export async function me(req: Request, res: Response) {
  const user = (req as any).user;
  res.json({ success: true, user });
}
