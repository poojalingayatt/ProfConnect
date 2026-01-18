import { Router } from "express";
import * as ctrl from "../controllers/profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, ctrl.getProfile);
router.put("/", authMiddleware, ctrl.updateProfile);

export default router;
