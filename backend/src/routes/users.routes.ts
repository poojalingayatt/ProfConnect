import { Router } from "express";
import * as ctrl from "../controllers/users.controller";

const router = Router();

router.get("/", ctrl.getUsers);
router.get("/:id", ctrl.getUserById);

export default router;
