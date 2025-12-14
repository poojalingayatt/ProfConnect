import { Router } from "express";
import * as ctrl from "../controllers/availability.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { availabilitySchema } from "../validators/availability.validators";

const router = Router();

router.get("/:facultyId", authMiddleware, ctrl.getAvailability);
router.put("/me", authMiddleware, roleMiddleware(["faculty"]), validateBody(availabilitySchema), ctrl.updateMyAvailability);

export default router;
