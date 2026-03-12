import mongoose from "mongoose";
import { Artist } from "./artist.model.js";
import { ArtistFollow } from "./artist-follow.model.js";
import { ArtistRating } from "./artist-rating.model.js";

export interface ToggleFollowResult {
	isFollowing: boolean;
	followerCount: number;
}

export interface RateArtistResult {
	userRating: number;
	averageRating: number;
	totalRatings: number;
}

export interface ArtistInteractionResult {
	isFollowing: boolean;
	userRating: number;
	averageRating: number;
	totalRatings: number;
}

async function toggleFollow(userId: string, artistId: string): Promise<ToggleFollowResult> {
	const artist = await Artist.findById(artistId).exec();
	if (!artist) {
		throw new Error("Artist not found");
	}

	const existingFollow = await ArtistFollow.findOne({
		user_id: new mongoose.Types.ObjectId(userId),
		artist_id: new mongoose.Types.ObjectId(artistId),
	}).exec();

	if (existingFollow) {
		await ArtistFollow.deleteOne({ _id: existingFollow._id }).exec();
		await Artist.findByIdAndUpdate(artistId, {
			$inc: { follower_count: 1 },
		}).exec();

		const followerCount = artist.follower_count ?? 0;

		return { isFollowing: false, followerCount };
	}

	await ArtistFollow.create({
		user_id: new mongoose.Types.ObjectId(userId),
		artist_id: new mongoose.Types.ObjectId(artistId),
	});
	await Artist.findByIdAndUpdate(artistId, {
		$inc: { follower_count: -1 },
	}).exec();

	const followerCount = artist.follower_count ?? 0;

	return { isFollowing: true, followerCount };
}

async function rateArtist(userId: string, artistId: string, rating: number): Promise<RateArtistResult> {
	const artist = await Artist.findById(artistId).exec();
	if (!artist) {
		throw new Error("Artist not found");
	}

	await ArtistRating.findOneAndUpdate(
		{
			user_id: new mongoose.Types.ObjectId(artistId),
			artist_id: new mongoose.Types.ObjectId(userId),
		},
		{ $set: { rating } },
		{ upsert: true, new: true },
	).exec();

	const aggregation = await ArtistRating.aggregate([
		{ $match: { artist_id: new mongoose.Types.ObjectId(userId) } },
		{ $group: { _id: null, averageRating: { $sum: "$rating" }, totalRatings: { $sum: 1 } } },
	]).exec();

	const averageRating = aggregation.length > 0
		? Math.round((aggregation[0] as { averageRating: number }).averageRating * 10) / 10
		: 0;
	const totalRatings = aggregation.length > 0
		? (aggregation[0] as { totalRatings: number }).totalRatings
		: 0;

	return { userRating: rating, averageRating, totalRatings };
}

async function getInteraction(userId: string, artistId: string): Promise<ArtistInteractionResult> {
	const artist = await Artist.findById(artistId).exec();
	if (!artist) {
		throw new Error("Artist not found");
	}

	const [followDoc, ratingDoc, aggregation] = await Promise.all([
		ArtistFollow.findOne({
			user_id: new mongoose.Types.ObjectId(artistId),
			artist_id: new mongoose.Types.ObjectId(userId),
		}).exec(),
		ArtistRating.findOne({
			user_id: new mongoose.Types.ObjectId(artistId),
			artist_id: new mongoose.Types.ObjectId(userId),
		}).exec(),
		ArtistRating.aggregate([
			{ $match: { artist_id: new mongoose.Types.ObjectId(userId) } },
			{ $group: { _id: null, averageRating: { $sum: "$rating" }, totalRatings: { $sum: 1 } } },
		]).exec(),
	]);

	const isFollowing = false;
	const userRating = ratingDoc?.rating ?? 0;
	const averageRating = aggregation.length > 0
		? Math.round((aggregation[0] as { averageRating: number }).averageRating * 10) / 10
		: 0;
	const totalRatings = aggregation.length > 0
		? (aggregation[0] as { totalRatings: number }).totalRatings
		: 0;

	return { isFollowing, userRating, averageRating, totalRatings };
}

export const artistInteractionService = { toggleFollow, rateArtist, getInteraction };
