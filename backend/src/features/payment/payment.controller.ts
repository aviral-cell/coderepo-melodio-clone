import { Response } from "express";
import { paymentService, PaymentError } from "./payment.service.js";
import { validateCardPaymentRequest } from "./payment.dto.js";
import { ProcessCardPaymentRequest } from "./payment.types.js";
import { sendSuccess, sendError } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";
import { cacheService } from "../../shared/services/cache.service.js";
import { usersService } from "../users/users.service.js";
import { AccountType } from "../users/user.model.js";

const IDEMPOTENCY_CACHE_TTL = 3600;

export const paymentController = {
	async processCardPayment(
		req: AuthenticatedRequest,
		res: Response,
	): Promise<void> {
		try {
			const userId = req.user?.userId;
			if (!userId) {
				sendError(res, "User not authenticated", 401);
				return;
			}

			const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

			if (idempotencyKey) {
				const cachedResult = cacheService.get<{ success: boolean; data: unknown }>(
					`payment:${idempotencyKey}`,
				);

				if (cachedResult) {
					sendSuccess(res, cachedResult.data);
					return;
				}
			}

			const validationErrors = validateCardPaymentRequest(req.body);
			if (validationErrors.length > 0) {
				sendError(res, "Validation failed", 400, validationErrors);
				return;
			}

			const body = req.body as ProcessCardPaymentRequest;

			const result = await paymentService.processCardPayment(
				userId,
				body.subscriptionPrice,
				body.cardDetails,
				idempotencyKey || null,
			);

			if (idempotencyKey) {
				cacheService.set(
					`payment:${idempotencyKey}`,
					{ success: true, data: result },
					IDEMPOTENCY_CACHE_TTL,
				);
			}

			sendSuccess(res, result);
		} catch (error) {
			if (error instanceof PaymentError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			const message = error instanceof Error ? error.message : "An error occurred";
			res.status(500).json({ success: false, error: message });
		}
	},

	async getPaymentHistory(
		req: AuthenticatedRequest,
		res: Response,
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

			let paymentUserId = userId;

			if (user.account_type === AccountType.FAMILY_MEMBER && user.primary_account_id) {
				paymentUserId = user.primary_account_id.toString();
			}

			const payments = await paymentService.getPaymentHistory(paymentUserId);

			sendSuccess(res, { payments });
		} catch (error) {
			if (error instanceof PaymentError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			const message = error instanceof Error ? error.message : "An error occurred";
			res.status(500).json({ success: false, error: message });
		}
	},
};
