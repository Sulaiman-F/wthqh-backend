import { Router } from "express";
import { authorized } from "../middleware/auth.middleware";
import { searchDocuments } from "../controllers/search.controller";

const router = Router();

router.use(authorized);
router.get("/", searchDocuments);

export default router;
