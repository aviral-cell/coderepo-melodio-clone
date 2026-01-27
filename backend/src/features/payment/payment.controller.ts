import { Response, NextFunction } from "express";
import mongoose, { ClientSession } from "mongoose";
import { paymentService, PaymentError } from "./payment.service.js";
import { validateCardPaymentRequest } from "./payment.dto.js";
import { ProcessCardPaymentRequest } from "./payment.types.js";
import { sendSuccess, sendError } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";
import { cacheService } from "../../shared/services/cache.service.js";
import { usersService } from "../users/users.service.js";
import { AccountType } from "../users/user.model.js";

const IDEMPOTENCY_CACHE_TTL = 3600; // 1 hour in seconds

/**
 * Check if MongoDB is running as a replica set (supports transactions).
 */
async function isReplicaSet(): Promise<boolean> {
	try {
		const admin = mongoose.connection.db?.admin();
		if (!admin) return false;
		const result = await admin.command({ replSetGetStatus: 1 });
		return result && result.ok === 1;
	} catch {
		return false;
	}
}

export const paymentController = {
	/**
	 * POST /api/payment/card
	 * Process card payment for premium subscription upgrade.
	 */
	async processCardPayment(
		req: AuthenticatedRequest,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		let session: ClientSession | null = null;
		const useTransactions = await isReplicaSet();

		try {
			const userId = req.user?.userId;
			if (!userId) {
				sendError(res, "User not authenticated", 401);
				return;
			}

			// Extract idempotency key from header
			const idempotencyKey = req.headers["idempotency-key"] as string | undefined;

			// Check cache for existing result
			if (idempotencyKey) {
				const cachedResult = cacheService.get<{ success: boolean; data: unknown }>(
					`payment:${idempotencyKey}`,
				);

				if (cachedResult) {
					sendSuccess(res, cachedResult.data);
					return;
				}
			}

			// Validate request body
			const validationErrors = validateCardPaymentRequest(req.body);
			if (validationErrors.length > 0) {
				sendError(res, "Validation failed", 400, validationErrors);
				return;
			}

			const body = req.body as ProcessCardPaymentRequest;

			// Start MongoDB transaction if replica set available
			if (useTransactions) {
				session = await mongoose.startSession();
				session.startTransaction();
			}

			try {
				const result = await paymentService.processCardPayment(
					userId,
					body.subscriptionPrice,
					body.cardDetails,
					idempotencyKey || null,
					session,
				);

				// Commit transaction if using transactions
				if (session) {
					await session.commitTransaction();
				}

				// Cache result with idempotency key
				if (idempotencyKey) {
					cacheService.set(
						`payment:${idempotencyKey}`,
						{ success: true, data: result },
						IDEMPOTENCY_CACHE_TTL,
					);
				}

				sendSuccess(res, result);
			} catch (error) {
				// Abort transaction on any error
				if (session) {
					await session.abortTransaction();
				}
				throw error;
			}
		} catch (error) {
			if (error instanceof PaymentError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			next(error);
		} finally {
			if (session) {
				await session.endSession();
			}
		}
	},

	/**
	 * GET /api/payments
	 * Get payment history for current user.
	 * For family members, returns the primary account's payment history.
	 */
	async getPaymentHistory(
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
			next(error);
		}
	},
};
