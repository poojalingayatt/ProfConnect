import { Router } from "express";
import * as ctrl from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate.middleware";
import { registerSchema, loginSchema } from "../validators/auth.validators";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", validateBody(registerSchema), ctrl.register);
router.post("/login", validateBody(loginSchema), ctrl.login);
router.get("/me", authMiddleware, ctrl.me);

export default router;
