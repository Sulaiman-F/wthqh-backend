import { Router } from "express";
import { authorized } from "../middleware/auth.middleware";
import {
  me,
  signin,
  signup,
  refresh,
  logout,
} from "../controllers/auth.controller";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authorized, me);

export default router;
