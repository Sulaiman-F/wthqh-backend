import { Request, Response } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import { Share } from "../models/share.model";
import { DocModel } from "../models/document.model";
import { Version } from "../models/version.model";
import { getGridFSBucket } from "../services/gridfs.service";

function buildPublicUrl(req: Request, token: string) {
  const host = req.get("host");
  const protocol = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  // Routes are mounted under /api
  return `${protocol}://${host}/api/public/${token}`;
}

export async function createShare(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { id } = req.params; // document id
    const { expiresInHours } = req.body as { expiresInHours?: number };

    const doc = await DocModel.findById(id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    if (user.role !== "admin" && doc.owner.toString() !== user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    let expiresAt: Date | undefined = undefined;
    if (expiresInHours !== undefined) {
      const hrs = Number(expiresInHours);
      if (!Number.isFinite(hrs) || hrs <= 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "expiresInHours must be a positive number",
          });
      }
      expiresAt = new Date(Date.now() + hrs * 60 * 60 * 1000);
    }

    // create unique token (retry on rare collision)
    let token = crypto.randomBytes(24).toString("hex");
    for (let i = 0; i < 3; i++) {
      try {
        const share = await Share.create({
          document: doc._id,
          token,
          expiresAt,
        });
        return res.status(201).json({
          success: true,
          token: share.token,
          url: buildPublicUrl(req, share.token),
          expiresAt: share.expiresAt || null,
        });
      } catch (err: any) {
        if (err && err.code === 11000) {
          token = crypto.randomBytes(24).toString("hex");
          continue;
        }
        throw err;
      }
    }
    // If we somehow get here
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate share token" });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}

export async function publicViewDocument(req: Request, res: Response) {
  try {
    const { token } = req.params;
    const share = await Share.findOne({ token });
    if (!share)
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired link" });
    if (share.expiresAt && share.expiresAt.getTime() <= Date.now()) {
      return res.status(410).json({ success: false, message: "Link expired" });
    }

    const doc = await DocModel.findById(share.document);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });

    // Get latest version
    const latest = await Version.find({ document: doc._id })
      .sort({ versionNumber: -1 })
      .limit(1);
    if (!latest.length)
      return res.status(404).json({ success: false, message: "No versions" });
    const v = latest[0];

    const bucket = getGridFSBucket();
    const stream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(v.storageKey)
    );
    res.setHeader("Content-Type", v.mimeType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${doc.title || "document"}-v${v.versionNumber}.pdf"`
    );
    stream.on("error", () => res.status(404).end());
    stream.pipe(res);
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e.message });
  }
}
