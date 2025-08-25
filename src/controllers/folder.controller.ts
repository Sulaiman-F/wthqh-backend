import { Request, Response } from "express";
import mongoose from "mongoose";
import { Folder } from "../models/folder.model";
import { DocModel } from "../models/document.model";

export async function createFolder(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string };
    const { name, parentFolderId } = req.body as any;
    if (!name)
      return res.status(400).json({ success: false, message: "Name required" });

    const folder = await Folder.create({
      name,
      owner: new mongoose.Types.ObjectId(user.userId),
      parentFolder: parentFolderId
        ? new mongoose.Types.ObjectId(parentFolderId)
        : null,
    });

    res.status(201).json({ success: true, folder });
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Folder name already exists in this location",
      });
    }
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function listFolders(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string };
    const { parent, tree } = req.query as any;

    // Tree mode: return nested folders for the user
    if (tree && (tree === "1" || tree === "true")) {
      const all = await Folder.find({ owner: user.userId }).lean();
      const map: Record<string, any> = {};
      const roots: any[] = [];
      for (const f of all) {
        map[f._id.toString()] = { ...f, id: f._id.toString(), children: [] };
      }
      for (const f of all) {
        const node = map[f._id.toString()];
        if (f.parentFolder) {
          const pid = (f.parentFolder as any).toString();
          if (map[pid]) map[pid].children.push(node);
          else roots.push(node); // orphan safety
        } else {
          roots.push(node);
        }
      }
      return res.json({ success: true, tree: roots });
    }

    // List mode: children under parent, or roots if parent not provided
    const filter: any = { owner: user.userId };
    filter.parentFolder = parent ? parent : null;
    const folders = await Folder.find(filter).sort({ name: 1 });
    res.json({ success: true, folders });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function updateFolder(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string };
    const { id } = req.params;
    const { name } = req.body as any;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid id" });
    if (!name)
      return res.status(400).json({ success: false, message: "Name required" });

    const folder = await Folder.findOne({ _id: id, owner: user.userId });
    if (!folder)
      return res
        .status(404)
        .json({ success: false, message: "Folder not found" });

    folder.name = name;
    await folder.save().catch((e: any) => {
      if (e?.code === 11000) {
        throw Object.assign(
          new Error("Folder name already exists in this location"),
          { status: 409 }
        );
      }
      throw e;
    });

    res.json({ success: true, folder });
  } catch (e: any) {
    const status = e?.status || 500;
    res.status(status).json({ success: false, message: e.message });
  }
}

export async function deleteFolder(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string };
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
      return res.status(400).json({ success: false, message: "Invalid id" });

    const folder = await Folder.findOne({ _id: id, owner: user.userId });
    if (!folder)
      return res
        .status(404)
        .json({ success: false, message: "Folder not found" });

    const childCount = await Folder.countDocuments({
      owner: user.userId,
      parentFolder: id,
    });
    const docCount = await DocModel.countDocuments({
      owner: user.userId,
      folder: id,
    });
    if (childCount > 0 || docCount > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Folder is not empty" });
    }

    await Folder.deleteOne({ _id: id });
    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}

export async function getFolderDocuments(req: Request, res: Response) {
  try {
    const user = (req as any).user as { userId: string };
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid folder id" });
    }
    // Ensure folder belongs to user
    const folder = await Folder.findOne({ _id: id, owner: user.userId });
    if (!folder)
      return res
        .status(404)
        .json({ success: false, message: "Folder not found" });

    const docs = await DocModel.find({ owner: user.userId, folder: id }).sort({
      updatedAt: -1,
    });
    res.json({ success: true, documents: docs });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message });
  }
}
