import { Response } from "express";
import { familyService, FamilyError } from "./family.service.js";
import { validateFamilyMemberRequest, FamilyMemberDto } from "./family.dto.js";
import { sendSuccess, sendError, isValidObjectId } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";

export const familyController = {
	async addFamilyMember(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				sendError(res, "User not authenticated", 401);
				return;
			}

			const validationErrors = validateFamilyMemberRequest(req.body);
			if (validationErrors.length > 0) {
				sendError(res, "Validation failed", 400, validationErrors);
				return;
			}

			const memberData = req.body as FamilyMemberDto;
			const familyMember = await familyService.addFamilyMember(userId, memberData);

			sendSuccess(res, familyMember, undefined, 201);
		} catch (error) {
			if (error instanceof FamilyError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async getFamilyMembers(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				sendError(res, "User not authenticated", 401);
				return;
			}

			const result = await familyService.getFamilyMembers(userId);

			sendSuccess(res, result);
		} catch (error) {
			if (error instanceof FamilyError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},

	async removeFamilyMember(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				sendError(res, "User not authenticated", 401);
				return;
			}

			const { memberId } = req.params;

			if (!memberId || !isValidObjectId(memberId)) {
				sendError(res, "Invalid member ID", 400);
				return;
			}

			await familyService.removeFamilyMember(userId, memberId);

			sendSuccess(res, { message: "Family member removed successfully" });
		} catch (error) {
			if (error instanceof FamilyError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
