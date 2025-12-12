import { Router } from "express";
import { playlistsController } from "./playlists.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

// All playlist routes require authentication
router.use(authMiddleware);

// GET /api/playlists - Get all playlists owned by the authenticated user
router.get("/", playlistsController.getAll);

// GET /api/playlists/:id - Get a single playlist by ID with populated tracks
router.get("/:id", playlistsController.getById);

// POST /api/playlists - Create a new playlist
router.post("/", playlistsController.create);

// PATCH /api/playlists/:id - Update a playlist (owner only)
router.patch("/:id", playlistsController.update);

// DELETE /api/playlists/:id - Delete a playlist (owner only)
router.delete("/:id", playlistsController.delete);

// POST /api/playlists/:id/tracks - Add a track to a playlist (owner only)
router.post("/:id/tracks", playlistsController.addTrack);

// DELETE /api/playlists/:id/tracks/:trackId - Remove a track from a playlist (owner only)
router.delete("/:id/tracks/:trackId", playlistsController.removeTrack);

// PATCH /api/playlists/:id/reorder - Reorder tracks in a playlist (owner only)
router.patch("/:id/reorder", playlistsController.reorderTracks);

export const playlistRoutes = router;
