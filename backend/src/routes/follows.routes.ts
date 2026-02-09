import { Router } from "express";
import * as ctrl from "../controllers/follows.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { roleMiddleware } from "../middleware/role.middleware";

const router = Router();

// note: prefer restful path: /:facultyId
router.post("/:facultyId", authMiddleware, roleMiddleware(["student"]), ctrl.followFaculty);
router.delete("/:facultyId", authMiddleware, roleMiddleware(["student"]), ctrl.unfollowFaculty);
router.get("/me", authMiddleware, roleMiddleware(["student"]), ctrl.getMyFollows);
router.get("/faculty/me", authMiddleware, roleMiddleware(["faculty"]), ctrl.getFollowers);

export default router;
