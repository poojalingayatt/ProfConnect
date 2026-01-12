import { Router } from "express";
import * as ctrl from "../controllers/users.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", ctrl.getUsers);
router.get("/stats", authMiddleware, ctrl.getMyStats);
router.get("/:id", ctrl.getUserById);
router.patch("/me", authMiddleware, ctrl.updateProfile);
router.patch("/me/password", authMiddleware, ctrl.changePassword);

export default router;
