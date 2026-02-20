import { Router } from "express";
import { mixesController } from "./mixes.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", mixesController.create);

router.get("/", mixesController.getAll);

router.get("/:id", mixesController.getById);

router.patch("/:id", mixesController.rename);

router.delete("/:id", mixesController.delete);

export const mixRoutes = router;
