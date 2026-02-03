import mongoose, { ClientSession } from "mongoose";
import { Subscription } from "./subscription.model.js";
import {
	FREE_PLAYLIST_LIMIT,
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

	async canCreatePlaylist(userId: string): Promise<boolean> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const subscription = await Subscription.findOne({ user_id: userObjectId }).exec();

		if (!subscription || subscription.plan === SubscriptionPlan.FREE) {
			const playlistCount = await Playlist.countDocuments({
				owner_id: userObjectId,
			}).exec();

			return playlistCount < FREE_PLAYLIST_LIMIT;
		}

		return true;
	},

	async isPremium(userId: string): Promise<boolean> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const subscription = await Subscription.findOne({ user_id: userObjectId }).exec();

		return subscription?.plan === SubscriptionPlan.PREMIUM;
	},
};
