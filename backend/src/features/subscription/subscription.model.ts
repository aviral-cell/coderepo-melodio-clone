import mongoose, { Schema, Model } from "mongoose";
import {
	ISubscriptionDocument,
	SubscriptionPlan,
} from "./subscription.types.js";

const subscriptionSchema = new Schema<ISubscriptionDocument>(
	{
		user_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		plan: {
			type: String,
			enum: Object.values(SubscriptionPlan),
			default: SubscriptionPlan.FREE,
			required: true,
		},
		start_date: {
			type: Date,
			required: true,
		},
		end_date: {
			type: Date,
			default: null,
		},
		auto_renew: {
			type: Boolean,
			default: false,
		},
	},
	{
		timestamps: {
			createdAt: "created_at",
			updatedAt: "updated_at",
		},
	},
);

subscriptionSchema.index(
	{ user_id: 1 },
	{ unique: true, name: "user_id_unique_idx" },
);

export const Subscription: Model<ISubscriptionDocument> =
	mongoose.model<ISubscriptionDocument>(
		"Subscription",
		subscriptionSchema,
		"subscriptions",
	);
