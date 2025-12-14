import { Router } from "express";
import * as ctrl from "../controllers/appointments.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";
import { validateBody } from "../middleware/validate.middleware";
import { createAppointmentSchema } from "../validators/appointment.validators";

const router = Router();

router.post("/", authMiddleware, roleMiddleware(["student"]), validateBody(createAppointmentSchema), ctrl.createAppointment);
router.get("/me", authMiddleware, ctrl.getMyAppointments);
router.get("/:id", authMiddleware, ctrl.getAppointmentById);
router.patch("/:id/accept", authMiddleware, roleMiddleware(["faculty"]), ctrl.acceptAppointment);
router.patch("/:id/reject", authMiddleware, roleMiddleware(["faculty"]), ctrl.rejectAppointment);
router.patch("/:id/reschedule", authMiddleware, roleMiddleware(["faculty"]), ctrl.rescheduleAppointment);
router.patch("/:id/cancel", authMiddleware, ctrl.cancelAppointment);
router.patch("/:id/complete", authMiddleware, roleMiddleware(["faculty"]), ctrl.completeAppointment);

export default router;
