import { Router } from "express";
import { familyController } from "./family.controller.js";
import { authMiddleware } from "../../shared/middleware/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware, familyController.addFamilyMember);
router.get("/", authMiddleware, familyController.getFamilyMembers);
router.delete("/:memberId", authMiddleware, familyController.removeFamilyMember);

export const familyRoutes = router;
