import { Router } from "express";
import { subscriptionController } from "./subscription.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, subscriptionController.getSubscription);

export const subscriptionRoutes: Router = router;
