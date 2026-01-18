import { Router } from "express";
import * as ctrl from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validators";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", validateBody(registerSchema), ctrl.register);
router.post("/login", validateBody(loginSchema), ctrl.login);
router.get("/me", authMiddleware, ctrl.me);
router.get("/verify-email/:token", ctrl.verifyEmail);
router.post("/resend-verification", ctrl.resendVerification);
router.post("/forgot-password", ctrl.forgotPassword);
router.post("/reset-password/:token", ctrl.resetPassword);
router.get("/profile-status", authMiddleware, ctrl.checkProfileStatus);

export default router;
