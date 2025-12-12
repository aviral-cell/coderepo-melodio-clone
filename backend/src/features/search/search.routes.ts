import { Router } from "express";
import { searchController } from "./search.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", searchController.search);

export const searchRoutes = router;
