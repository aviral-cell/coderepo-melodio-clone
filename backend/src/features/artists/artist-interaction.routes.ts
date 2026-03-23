import { Router } from "express";
import { artistInteractionController } from "./artist-interaction.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/:id/follow", artistInteractionController.toggleFollow);

router.post("/:id/rate", artistInteractionController.rateArtist);

router.get("/:id/interaction", artistInteractionController.getInteraction);

export const artistInteractionRoutes: Router = router;
