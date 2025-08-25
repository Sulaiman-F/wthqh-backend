import { Router } from "express";
import { authorized } from "../middleware/auth.middleware";
import {
  createShare,
  publicViewDocument,
} from "../controllers/share.controller";

const router = Router();

// Authenticated: create a share link
router.post("/documents/:id/share", authorized, createShare);

// Public: read-only view (no auth)
router.get("/public/:token", publicViewDocument);

export default router;
