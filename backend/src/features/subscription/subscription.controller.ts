import { Response, NextFunction } from "express";
import { subscriptionService, SubscriptionError } from "./subscription.service.js";
import { sendSuccess, sendError } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";
import { usersService } from "../users/users.service.js";
import { AccountType } from "../users/user.model.js";

export const subscriptionController = {
	/**
	 * GET /api/subscription
	 * Get current user's subscription.
	 * For family members, returns the primary account's subscription.
	 */
	async getSubscription(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				sendError(res, "User not authenticated", 401);
				return;
			}

			const user = await usersService.findById(userId);
			if (!user) {
				sendError(res, "User not found", 404);
				return;
			}

			let subscriptionUserId = userId;
			let isFamilyMember = false;

			if (user.account_type === AccountType.FAMILY_MEMBER && user.primary_account_id) {
				subscriptionUserId = user.primary_account_id.toString();
				isFamilyMember = true;
			}

			const subscription = await subscriptionService.getByUserId(subscriptionUserId);

			sendSuccess(res, {
				...subscription,
				isFamilyMember,
				primaryAccountId: isFamilyMember ? subscriptionUserId : null,
			});
		} catch (error) {
			if (error instanceof SubscriptionError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			next(error);
		}
	},
};
