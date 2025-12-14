import { Router } from "express";
import * as ctrl from "../controllers/notifications.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/me", authMiddleware, ctrl.getMyNotifications);
router.patch("/:id/read", authMiddleware, ctrl.markRead);
router.patch("/read-all", authMiddleware, ctrl.markReadAll);
router.delete("/:id", authMiddleware, ctrl.deleteNotification);

export default router;
