import { Router } from "express";
import { artistsController } from "./artists.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", artistsController.getAll);

router.get("/search", artistsController.search);

router.get("/:id", artistsController.getById);

export const artistRoutes = router;
