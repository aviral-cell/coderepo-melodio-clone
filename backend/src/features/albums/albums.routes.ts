import { Router } from "express";
import { albumsController } from "./albums.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

// All album routes require authentication
router.use(authMiddleware);

// GET /api/albums - Get paginated list of albums (optional artistId filter)
router.get("/", albumsController.getAll);

// GET /api/albums/search - Search albums by title
// Note: This route must come BEFORE /:id to prevent "search" being treated as an ID
router.get("/search", albumsController.search);

// GET /api/albums/:id - Get a single album by ID
router.get("/:id", albumsController.getById);

export const albumRoutes = router;
