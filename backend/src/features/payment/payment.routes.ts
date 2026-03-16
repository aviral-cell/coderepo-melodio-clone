import { Router } from "express";
import { paymentController } from "./payment.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.post("/card", authMiddleware, paymentController.processCardPayment);
router.get("/", authMiddleware, paymentController.getPaymentHistory);

export const paymentRoutes: Router = router;
