import { Request, Response } from "express";
import mongoose from "mongoose";
import { DocModel } from "../models/document.model";
import { Version } from "../models/version.model";
import { getGridFSBucket } from "../services/gridfs.service";

export async function createDocument(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string };
    const { title, description, tags, folderId } = req.body as any;
    const file = (req as any).file as any | undefined;
    if (!title || !folderId || !file)
      return res
        .status(400)
        .json({ success: false, message: "Missing fields or file" });
    if (file.mimetype !== "application/pdf")
      return res
        .status(400)
        .json({ success: false, message: "Only PDF allowed" });

    // Upload to GridFS
    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });
    uploadStream.end(file.buffer);
    await new Promise<void>((resolve, reject) => {
      uploadStream.on("finish", () => resolve());
      uploadStream.on("error", reject);
    });

    const fileId = uploadStream.id as mongoose.Types.ObjectId;

    const doc = await DocModel.create({
      folder: new mongoose.Types.ObjectId(folderId),
      owner: new mongoose.Types.ObjectId(user.userId),
      title,
      description,
      tags:
        typeof tags === "string"
          ? tags
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : Array.isArray(tags)
          ? tags
          : [],
    });

    const versionCount = await Version.countDocuments({ document: doc._id });

    const v = await Version.create({
      document: doc._id,
      versionNumber: versionCount + 1,
      storageKey: (fileId as mongoose.Types.ObjectId).toHexString(),
      sizeBytes: file.size,
      mimeType: file.mimetype,
    });

    res.status(201).json({ success: true, document: doc, version: v });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getMyDocuments(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string };
    const { folderId } = req.query as any;
    const filter: any = { owner: user.userId };
    if (folderId) filter.folder = folderId;
    const docs = await DocModel.find(filter).sort({ updatedAt: -1 });
    res.json({ success: true, documents: docs });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getDocument(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { id } = req.params;
    const doc = await DocModel.findById(id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });
    if (user.role !== "admin" && doc.owner.toString() !== user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    res.json({ success: true, document: doc });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function downloadLatest(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { id } = req.params;
    const doc = await DocModel.findById(id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });
    if (user.role !== "admin" && doc.owner.toString() !== user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const latest = await Version.find({ document: id })
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
      `attachment; filename="doc-${id}-v${v.versionNumber}.pdf"`
    );
    stream.on("error", () => res.status(404).end());
    stream.pipe(res);
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function updateDocument(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { id } = req.params;
    const { title, description, tags } = req.body as any;
    const doc = await DocModel.findById(id);
    if (!doc)
      return res.status(404).json({ success: false, message: "Not found" });
    if (user.role !== "admin" && doc.owner.toString() !== user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (title !== undefined) doc.title = title;
    if (description !== undefined) doc.description = description;
    if (tags !== undefined)
      doc.tags = Array.isArray(tags)
        ? tags
        : typeof tags === "string"
        ? tags
            .split(",")
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];
    await doc.save();

    res.json({ success: true, document: doc });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function addVersion(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { id } = req.params; // document id
    const file = (req as any).file as any | undefined;
    if (!file || file.mimetype !== "application/pdf") {
      return res
        .status(400)
        .json({ success: false, message: "PDF file required" });
    }
    const doc = await DocModel.findById(id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    if (user.role !== "admin" && doc.owner.toString() !== user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const bucket = getGridFSBucket();
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });
    uploadStream.end(file.buffer);
    await new Promise<void>((resolve, reject) => {
      uploadStream.on("finish", () => resolve());
      uploadStream.on("error", reject);
    });
    const fileId = uploadStream.id as mongoose.Types.ObjectId;

    const versionCount = await Version.countDocuments({ document: id });
    const v = await Version.create({
      document: id,
      versionNumber: versionCount + 1,
      storageKey: (fileId as mongoose.Types.ObjectId).toHexString(),
      sizeBytes: file.size,
      mimeType: file.mimetype,
    });

    res.status(201).json({ success: true, version: v });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function listVersions(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { id } = req.params; // document id
    const doc = await DocModel.findById(id);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    if (user.role !== "admin" && doc.owner.toString() !== user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const versions = await Version.find({ document: id }).sort({
      versionNumber: -1,
    });
    res.json({ success: true, versions });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function downloadVersionById(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string; role: string };
    const { versionId } = req.params;
    if (!mongoose.isValidObjectId(versionId))
      return res
        .status(400)
        .json({ success: false, message: "Invalid version id" });

    const version = await Version.findById(versionId);
    if (!version)
      return res
        .status(404)
        .json({ success: false, message: "Version not found" });

    const doc = await DocModel.findById(version.document);
    if (!doc)
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    if (user.role !== "admin" && doc.owner.toString() !== user.userId) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const bucket = getGridFSBucket();
    const stream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(version.storageKey)
    );
    res.setHeader("Content-Type", version.mimeType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="doc-${doc._id}-v${version.versionNumber}.pdf"`
    );
    stream.on("error", () => res.status(404).end());
    stream.pipe(res);
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}
