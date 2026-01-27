import mongoose, { ClientSession } from "mongoose";
import { Subscription } from "./subscription.model.js";
import {
	ISubscriptionDocument,
	SubscriptionPlan,
	SubscriptionResponse,
} from "./subscription.types.js";
import { Playlist } from "../playlists/playlist.model.js";

export class SubscriptionError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.name = "SubscriptionError";
	}
}

function transformSubscription(sub: ISubscriptionDocument): SubscriptionResponse {
	return {
		_id: sub._id.toString(),
		userId: sub.user_id.toString(),
		plan: sub.plan,
		startDate: sub.start_date.toISOString(),
		endDate: sub.end_date ? sub.end_date.toISOString() : null,
		autoRenew: sub.auto_renew,
		createdAt: sub.created_at.toISOString(),
		updatedAt: sub.updated_at.toISOString(),
	};
}

export const subscriptionService = {
	/**
	 * Get subscription by user ID. Creates a free subscription if none exists.
	 */
	async getByUserId(userId: string): Promise<SubscriptionResponse> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const subscription = await Subscription.findOne({ user_id: userObjectId }).exec();

		if (!subscription) {
			const newSubscription = await Subscription.create({
				user_id: userObjectId,
				plan: SubscriptionPlan.FREE,
				start_date: new Date(),
				end_date: null,
				auto_renew: false,
			});
			return transformSubscription(newSubscription);
		}

		return transformSubscription(subscription);
	},

	/**
	 * Create a free subscription for a new user.
	 */
	async create(userId: string): Promise<SubscriptionResponse> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const existing = await Subscription.findOne({ user_id: userObjectId }).exec();
		if (existing) {
			return transformSubscription(existing);
		}

		const subscription = await Subscription.create({
			user_id: userObjectId,
			plan: SubscriptionPlan.FREE,
			start_date: new Date(),
			end_date: null,
			auto_renew: false,
		});
		return transformSubscription(subscription);
	},

	/**
	 * Upgrade user subscription to premium.
	 * Sets plan to premium, start_date to now, end_date to 1 month from now,
	 * and auto_renew to true.
	 */
	async upgradeToPremium(
		userId: string,
		session?: ClientSession,
	): Promise<ISubscriptionDocument> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const now = new Date();
		const oneMonthFromNow = new Date(now);
		oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

		const updateData = {
			plan: SubscriptionPlan.PREMIUM,
			start_date: now,
			end_date: oneMonthFromNow,
			auto_renew: true,
		};

		const options = session ? { new: true, upsert: true, session } : { new: true, upsert: true };

		const subscription = await Subscription.findOneAndUpdate(
			{ user_id: userObjectId },
			{
				$set: updateData,
				$setOnInsert: { user_id: userObjectId },
			},
			options,
		).exec();

		if (!subscription) {
			throw new SubscriptionError("Failed to upgrade subscription", 500);
		}

		return subscription;
	},

	/**
	 * Check if user can create a new playlist.
	 * Free users: max 2 playlists
	 * Premium users: unlimited playlists
	 */
	async canCreatePlaylist(userId: string): Promise<boolean> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const subscription = await Subscription.findOne({ user_id: userObjectId }).exec();

		if (!subscription || subscription.plan === SubscriptionPlan.FREE) {
			const playlistCount = await Playlist.countDocuments({
				owner_id: userObjectId,
			}).exec();

			return playlistCount < 2;
		}

		return true;
	},

	/**
	 * Check if user has premium subscription.
	 */
	async isPremium(userId: string): Promise<boolean> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const subscription = await Subscription.findOne({ user_id: userObjectId }).exec();

		return subscription?.plan === SubscriptionPlan.PREMIUM;
	},
};
