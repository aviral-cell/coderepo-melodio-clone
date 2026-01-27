import mongoose, { Schema, Model } from "mongoose";
import { IPaymentDocument, PaymentStatus } from "./payment.types.js";

const paymentSchema = new Schema<IPaymentDocument>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		amount: {
			type: Number,
			required: true,
			min: [0.01, "Amount must be at least 0.01"],
		},
		status: {
			type: String,
			enum: Object.values(PaymentStatus),
			default: PaymentStatus.PENDING,
		},
		card_last4: {
			type: String,
			required: true,
			minlength: [4, "Card last 4 digits must be exactly 4 characters"],
			maxlength: [4, "Card last 4 digits must be exactly 4 characters"],
		},
		idempotency_key: {
			type: String,
			default: null,
		},
		timestamp: {
			type: Date,
			required: true,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

paymentSchema.index({ user_id: 1 }, { name: "user_id_asc_idx" });
paymentSchema.index({ idempotency_key: 1 }, { name: "idempotency_key_asc_idx" });

export const Payment: Model<IPaymentDocument> = mongoose.model<IPaymentDocument>(
	"Payment",
	paymentSchema,
	"payments",
);
