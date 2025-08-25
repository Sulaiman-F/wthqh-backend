import { Request, Response } from "express";
import mongoose from "mongoose";
import { DocModel } from "../models/document.model";
import { Version } from "../models/version.model";

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchDocuments(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const qRaw = (req.query.q as string) || "";
    const q = qRaw.trim();
    if (!q)
      return res.status(400).json({ success: false, message: "q is required" });

    const regex = new RegExp(escapeRegex(q), "i");
    const ownerFilter: any =
      user.role === "admin" ? {} : { owner: user.userId };

    // 1) Search by document metadata (title, tags, description)
    const docsByMeta = await DocModel.find({
      ...ownerFilter,
      $or: [
        { title: regex },
        { description: regex },
        { tags: { $elemMatch: { $regex: regex } } },
      ],
    })
      .sort({ updatedAt: -1 })
      .lean();

    // 2) Search by filename in GridFS (pdfs.files.filename)
    const db = mongoose.connection.db;
    let docsByFilename: any[] = [];
    if (db) {
      const filesCol = db.collection("pdfs.files");
      const files = await filesCol
        .find({ filename: { $regex: regex } })
        .project({ _id: 1 })
        .toArray();

      if (files.length) {
        const fileIdsHex = files.map((f) => f._id.toString());
        const versions = await Version.find({
          storageKey: { $in: fileIdsHex },
        }).lean();
        const docIds = Array.from(
          new Set(versions.map((v: any) => v.document.toString()))
        );

        if (docIds.length) {
          const docFilter: any = { _id: { $in: docIds } };
          if (user.role !== "admin") docFilter.owner = user.userId;
          docsByFilename = await DocModel.find(docFilter).lean();
        }
      }
    }

    // Merge unique documents
    const map = new Map<string, any>();
    for (const d of docsByMeta) map.set(d._id.toString(), d);
    for (const d of docsByFilename) map.set(d._id.toString(), d);
    const documents = Array.from(map.values());

    res.json({ success: true, count: documents.length, documents });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}
