import { Router } from "express";
import { tracksController } from "./tracks.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", tracksController.getAll);

router.get("/search", tracksController.search);

router.get("/:id", tracksController.getById);

router.post("/:id/play", tracksController.play);

export const trackRoutes = router;
