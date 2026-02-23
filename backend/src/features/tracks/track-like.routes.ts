import { Router } from "express";
import { trackLikeController } from "./track-like.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/liked", trackLikeController.getLikedTracks);
router.get("/liked/ids", trackLikeController.getLikedIds);

router.post("/:id/like", trackLikeController.likeTrack);
router.post("/:id/dislike", trackLikeController.dislikeTrack);
router.delete("/:id/like", trackLikeController.removeReaction);
router.get("/:id/like-status", trackLikeController.getLikeStatus);

export const trackLikeRoutes = router;
