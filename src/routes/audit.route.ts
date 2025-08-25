import { Router } from "express";
import { authorized, restrictTo } from "../middleware/auth.middleware";
import { listAuditLogs } from "../controllers/audit.controller";

const router = Router();

router.get("/audit", authorized, restrictTo("admin"), listAuditLogs);

export default router;
