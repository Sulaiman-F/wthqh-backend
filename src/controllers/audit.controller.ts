import { Request, Response } from "express";
import { AuditLog } from "../models/auditLog.model";

export async function listAuditLogs(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const limitRaw = (req.query.limit as string) || "50";
    let limit = parseInt(limitRaw, 10);
    if (!Number.isFinite(limit) || limit <= 0) limit = 50;
    if (limit > 200) limit = 200; // cap

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, count: logs.length, logs });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}
