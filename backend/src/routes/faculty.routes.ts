import { Router } from "express";
import * as ctrl from "../controllers/faculty.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { facultyProfileSchema } from "../validators/faculty.validators";

const router = Router();

router.get("/", authMiddleware, ctrl.listFaculty);
router.get("/:facultyId", authMiddleware, ctrl.getFaculty);
router.patch("/me", authMiddleware, roleMiddleware(["faculty"]), validateBody(facultyProfileSchema), ctrl.updateMyProfile);
router.patch("/me/status", authMiddleware, roleMiddleware(["faculty"]), validateBody(facultyProfileSchema), ctrl.updateStatus);

export default router;
