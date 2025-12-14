import { Router } from "express";
import { albumsController } from "./albums.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", albumsController.getAll);

router.get("/search", albumsController.search);

router.get("/:id", albumsController.getById);

export const albumRoutes = router;
