import mongoose from "mongoose";

export enum PaymentStatus {
	PENDING = "pending",
	COMPLETED = "completed",
	FAILED = "failed",
	REFUNDED = "refunded",
}

export interface IPayment {
	user_id: mongoose.Types.ObjectId;
	amount: number;
	status: PaymentStatus;
	card_last4: string;
	idempotency_key: string | null;
	timestamp: Date;
	created_at: Date;
	updated_at: Date;
}

export interface IPaymentDocument extends IPayment, mongoose.Document {
	_id: mongoose.Types.ObjectId;
}

export interface CardDetails {
	cardNumber: string;
	expiryMonth: string;
	expiryYear: string;
	cvv: string;
}

export interface PaymentResponse {
	_id: string;
	userId: string;
	amount: number;
	status: PaymentStatus;
	cardLast4: string;
	idempotencyKey: string | null;
	timestamp: string;
	createdAt: string;
	updatedAt: string;
}

export interface CreatePaymentDto {
	user_id: mongoose.Types.ObjectId;
	amount: number;
	status?: PaymentStatus;
	card_last4: string;
	idempotency_key?: string | null;
	timestamp: Date;
}

export interface UpdatePaymentDto {
	status?: PaymentStatus;
}

export interface ProcessCardPaymentRequest {
	amount: number;
	subscriptionPrice: number;
	cardDetails: CardDetails;
}

export interface ProcessCardPaymentResponse {
	success: boolean;
	paymentId: string;
	message: string;
	subscription: {
		plan: string;
		startDate: string;
		endDate: string;
	};
}
