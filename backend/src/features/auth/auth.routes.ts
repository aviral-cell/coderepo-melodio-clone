import { Router } from "express";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.getMe);
router.post("/switch", authMiddleware, authController.switchAccount);

export const authRoutes: Router = router;
