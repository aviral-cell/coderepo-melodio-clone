import { Router } from "express";
import { artistsController } from "./artists.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

// All artist routes require authentication
router.use(authMiddleware);

// GET /api/artists - Get paginated list of artists
router.get("/", artistsController.getAll);

// GET /api/artists/search - Search artists by name
// Note: This route must come BEFORE /:id to prevent "search" being treated as an ID
router.get("/search", artistsController.search);

// GET /api/artists/:id - Get a single artist by ID
router.get("/:id", artistsController.getById);

export const artistRoutes = router;
