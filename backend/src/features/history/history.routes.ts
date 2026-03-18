import { Router } from "express";
import { historyController } from "./history.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/play", historyController.recordPlay);

router.get("/recently-played", historyController.getRecentlyPlayed);

router.delete("/recently-played", historyController.clearHistory);

export const historyRoutes = router;
