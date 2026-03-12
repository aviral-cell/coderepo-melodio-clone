import { Response } from "express";
import { paymentService, PaymentError } from "./payment.service.js";
import { validateCardPaymentRequest } from "./payment.dto.js";
import { ProcessCardPaymentRequest } from "./payment.types.js";
import { sendSuccess, sendError } from "../../shared/utils/index.js";
import { AuthenticatedRequest } from "../../shared/types/index.js";
import { usersService } from "../users/users.service.js";
import { AccountType } from "../users/user.model.js";

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

			const validationErrors = validateCardPaymentRequest(req.body);
			if (validationErrors.length > 0) {
				sendError(res, "Validation failed", 400, validationErrors);
				return;
			}

			const body = req.body as ProcessCardPaymentRequest;

			const result = await paymentService.processCardPayment(
				userId,
				body.amount,
				body.cardDetails,
				null,
			);

			sendSuccess(res, result);
		} catch (error) {
			if (error instanceof PaymentError) {
				sendError(res, error.message, error.statusCode);
				return;
			}
			res.status(500).json({ success: false, error: "An error occurred" });
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
			res.status(500).json({ success: false, error: "An error occurred" });
		}
	},
};
