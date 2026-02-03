import mongoose from "mongoose";

export enum SubscriptionPlan {
	FREE = "free",
	PREMIUM = "premium",
}

export interface ISubscription {
	user_id: mongoose.Types.ObjectId;
	plan: SubscriptionPlan;
	start_date: Date;
	end_date: Date | null;
	auto_renew: boolean;
	created_at: Date;
	updated_at: Date;
}

export interface ISubscriptionDocument extends ISubscription, mongoose.Document {
	_id: mongoose.Types.ObjectId;
}

export interface SubscriptionResponse {
	_id: string;
	userId: string;
	plan: SubscriptionPlan;
	startDate: string;
	endDate: string | null;
	autoRenew: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreateSubscriptionDto {
	user_id: mongoose.Types.ObjectId;
	plan?: SubscriptionPlan;
	start_date: Date;
	end_date?: Date | null;
	auto_renew?: boolean;
}

export interface UpdateSubscriptionDto {
	plan?: SubscriptionPlan;
	start_date?: Date;
	end_date?: Date | null;
	auto_renew?: boolean;
}

export const FREE_PLAYLIST_LIMIT = 7;
