import { Router } from "express";
import { playlistsController } from "./playlists.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", playlistsController.getAll);

router.get("/:id", playlistsController.getById);

router.post("/", playlistsController.create);

router.patch("/:id", playlistsController.update);

router.delete("/:id", playlistsController.delete);

router.post("/:id/tracks", playlistsController.addTrack);

router.delete("/:id/tracks/:trackId", playlistsController.removeTrack);

router.patch("/:id/reorder", playlistsController.reorderTracks);

router.post("/:id/copy", playlistsController.copyPlaylist);

export const playlistRoutes: Router = router;
