import { Router } from "express";
import multer, { FileFilterCallback } from "multer";
import { authorized } from "../middleware/auth.middleware";
import {
  createDocument,
  downloadLatest,
  getDocument,
  getMyDocuments,
  updateDocument,
  addVersion,
  listVersions,
  downloadVersionById,
} from "../controllers/document.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (
    _req: any,
    file: Express.Multer.File,
    cb: FileFilterCallback
  ) => {
    if (file.mimetype === "application/pdf") return cb(null, true);
    cb(new Error("Only PDF files are allowed"));
  },
});
const router = Router();

router.use(authorized);
router.post("/", upload.single("file"), createDocument);
router.get("/my", getMyDocuments);
router.get("/:id", getDocument);
router.patch("/:id", updateDocument);
router.post("/:id/versions", upload.single("file"), addVersion);
router.get("/:id/versions", listVersions);
router.get("/:id/download", downloadLatest);
router.get("/versions/:versionId/download", downloadVersionById);

export default router;
