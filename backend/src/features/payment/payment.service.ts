import mongoose from "mongoose";
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

export const paymentService = {
	async processCardPayment(
		userId: string,
		amount: number,
		cardDetails: CardDetails,
		idempotencyKey: string | null,
	): Promise<ProcessCardPaymentResponse> {
		const userObjectId = new mongoose.Types.ObjectId(userId);
		const cardLast4 = cardDetails.cardNumber.slice(-4);

		const isAlreadyPremium = await subscriptionService.isPremium(userId);
		if (isAlreadyPremium) {
			throw new PaymentError("Already subscribed to premium", 400);
		}

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
			{},
		);

		const payment = createdPayments[0];
		if (!payment) {
			throw new PaymentError("Failed to create payment record", 500);
		}

		const chargeResult = await this.chargeCard(cardDetails, amount);
		if (!chargeResult.success) {
			await Payment.findByIdAndUpdate(
				payment._id,
				{ status: PaymentStatus.FAILED },
				{},
			).exec();

			throw new PaymentError("Card charge failed", 400);
		}

		await Payment.findByIdAndUpdate(
			payment._id,
			{ status: PaymentStatus.COMPLETED },
			{},
		).exec();

		const subscription = await subscriptionService.upgradeToPremium(userId);

		await User.findByIdAndUpdate(
			userObjectId,
			{ subscription_status: SubscriptionStatus.PREMIUM },
			{},
		).exec();

		return {
			success: true,
			paymentId: payment._id.toString(),
			message: "Payment successful",
			subscription: {
				plan: subscription.plan,
				startDate: subscription.start_date.toISOString(),
				endDate: subscription.end_date!.toISOString(),
			},
		};
	},

	async chargeCard(
		cardDetails: CardDetails,
		amount: number,
	): Promise<{ success: boolean; error?: string }> {
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

		return {
			success: true,
		};
	},

	async getPaymentHistory(userId: string): Promise<PaymentResponse[]> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const payments = await Payment.find({ user_id: userObjectId })
			.sort({ timestamp: -1 })
			.exec();

		return payments.map(transformPayment);
	},

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
