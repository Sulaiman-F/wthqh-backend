import { Router } from "express";
import authRoutes from "./auth.route";
import foldersRoutes from "./folders.route";
import documentsRoutes from "./documents.route";
import searchRoutes from "./search.route";
import shareRoutes from "./share.route";
import auditRoutes from "./audit.route";

const router = Router();

router.use("/auth", authRoutes);
router.use("/folders", foldersRoutes);
router.use("/documents", documentsRoutes);
router.use("/search", searchRoutes);
router.use("/", shareRoutes);
router.use("/", auditRoutes);

export default router;
