import { Router } from "express";
import { concertsController } from "./concerts.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/", concertsController.list);

router.get("/:id", concertsController.getById);

router.post("/:id/tickets", concertsController.buyTickets);

router.get("/:id/tickets", concertsController.getUserTickets);

export const concertRoutes: Router = router;
