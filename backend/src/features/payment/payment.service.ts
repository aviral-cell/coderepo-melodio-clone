import mongoose, { ClientSession } from "mongoose";
import { Payment } from "./payment.model.js";
import {
	IPaymentDocument,
	PaymentStatus,
	CardDetails,
	PaymentResponse,
	ProcessCardPaymentResponse,
} from "./payment.types.js";
import { subscriptionService } from "../subscription/subscription.service.js";
import { User, SubscriptionStatus } from "../users/user.model.js";

export class PaymentError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.name = "PaymentError";
	}
}

function transformPayment(payment: IPaymentDocument): PaymentResponse {
	return {
		_id: payment._id.toString(),
		userId: payment.user_id.toString(),
		amount: payment.amount,
		status: payment.status,
		cardLast4: payment.card_last4,
		idempotencyKey: payment.idempotency_key,
		timestamp: payment.timestamp.toISOString(),
		createdAt: payment.created_at.toISOString(),
		updatedAt: payment.updated_at.toISOString(),
	};
}

function generateTransactionId(): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(2, 10);
	return `txn_card_${timestamp}_${random}`;
}

export const paymentService = {
	/**
	 * Process card payment and upgrade subscription.
	 * MUST use MongoDB transaction for atomicity.
	 */
	async processCardPayment(
		userId: string,
		amount: number,
		cardDetails: CardDetails,
		idempotencyKey: string | null,
		session: ClientSession | null,
	): Promise<ProcessCardPaymentResponse> {
		const userObjectId = new mongoose.Types.ObjectId(userId);
		const cardLast4 = cardDetails.cardNumber.slice(-4);

		// Check if user already has premium subscription
		const isAlreadyPremium = await subscriptionService.isPremium(userId);
		if (isAlreadyPremium) {
			throw new PaymentError("Already subscribed to premium", 400);
		}

		// Build session options (only if session provided)
		const sessionOpts = session ? { session } : {};

		// Create Payment record with status: pending
		const createdPayments = await Payment.create(
			[
				{
					user_id: userObjectId,
					amount,
					status: PaymentStatus.PENDING,
					card_last4: cardLast4,
					idempotency_key: idempotencyKey,
					timestamp: new Date(),
				},
			],
			sessionOpts,
		);

		const payment = createdPayments[0];
		if (!payment) {
			throw new PaymentError("Failed to create payment record", 500);
		}

		// Simulate card charge (always succeeds in mock)
		const chargeResult = await this.chargeCard(cardDetails, amount);
		if (!chargeResult.success) {
			// Update payment to failed
			await Payment.findByIdAndUpdate(
				payment._id,
				{ status: PaymentStatus.FAILED },
				sessionOpts,
			).exec();

			throw new PaymentError("Card charge failed", 400);
		}

		// Update Payment status to completed
		await Payment.findByIdAndUpdate(
			payment._id,
			{ status: PaymentStatus.COMPLETED },
			sessionOpts,
		).exec();

		// Upgrade subscription to premium
		const subscription = await subscriptionService.upgradeToPremium(
			userId,
			session || undefined,
		);

		// Also update user's subscription_status field
		await User.findByIdAndUpdate(
			userObjectId,
			{ subscription_status: SubscriptionStatus.PREMIUM },
			sessionOpts,
		).exec();

		return {
			success: true,
			paymentId: payment._id.toString(),
			transactionId: generateTransactionId(),
			message: "Payment successful",
			subscription: {
				plan: subscription.plan,
				startDate: subscription.start_date.toISOString(),
				endDate: subscription.end_date!.toISOString(),
			},
		};
	},

	/**
	 * Simulate card charge.
	 * In mock implementation, always succeeds as long as card format is valid.
	 */
	async chargeCard(
		cardDetails: CardDetails,
		amount: number,
	): Promise<{ success: boolean; transactionId?: string; error?: string }> {
		// Validate card format (should already be validated by DTO, but double-check)
		if (!/^\d{16}$/.test(cardDetails.cardNumber)) {
			return { success: false, error: "Invalid card number format" };
		}

		if (!/^(0[1-9]|1[0-2])$/.test(cardDetails.expiryMonth)) {
			return { success: false, error: "Invalid expiry month" };
		}

		if (!/^\d{2}$/.test(cardDetails.expiryYear)) {
			return { success: false, error: "Invalid expiry year" };
		}

		if (!/^\d{3}$/.test(cardDetails.cvv)) {
			return { success: false, error: "Invalid CVV" };
		}

		if (amount <= 0) {
			return { success: false, error: "Invalid amount" };
		}

		// Mock: Always succeed
		return {
			success: true,
			transactionId: generateTransactionId(),
		};
	},

	/**
	 * Get payment history for a user, sorted by timestamp descending.
	 */
	async getPaymentHistory(userId: string): Promise<PaymentResponse[]> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const payments = await Payment.find({ user_id: userObjectId })
			.sort({ timestamp: -1 })
			.exec();

		return payments.map(transformPayment);
	},

	/**
	 * Find payment by idempotency key.
	 */
	async findByIdempotencyKey(
		idempotencyKey: string,
	): Promise<PaymentResponse | null> {
		const payment = await Payment.findOne({ idempotency_key: idempotencyKey }).exec();

		if (!payment) {
			return null;
		}

		return transformPayment(payment);
	},
};
