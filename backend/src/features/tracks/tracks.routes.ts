import { Router } from "express";
import { tracksController } from "./tracks.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

// All track routes require authentication
router.use(authMiddleware);

// GET /api/tracks - Get paginated list of tracks (optional filters: genre, artistId, albumId)
router.get("/", tracksController.getAll);

// GET /api/tracks/search - Search tracks by title prefix or exact genre
// Note: This route must come BEFORE /:id to prevent "search" being treated as an ID
router.get("/search", tracksController.search);

// GET /api/tracks/:id - Get a single track by ID
router.get("/:id", tracksController.getById);

// POST /api/tracks/:id/play - Increment play count for a track
router.post("/:id/play", tracksController.play);

export const trackRoutes = router;
