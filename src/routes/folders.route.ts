import { Router } from "express";
import { authorized } from "../middleware/auth.middleware";
import {
  createFolder,
  listFolders,
  updateFolder,
  deleteFolder,
  getFolderDocuments,
} from "../controllers/folder.controller";

const router = Router();

router.use(authorized);
router.post("/", createFolder);
router.get("/", listFolders);
router.get("/:id/documents", getFolderDocuments);
router.patch("/:id", updateFolder);
router.delete("/:id", deleteFolder);

export default router;
