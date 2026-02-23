import mongoose from "mongoose";
import { Track } from "./track.model.js";
import { TrackLike } from "./track-like.model.js";
import { PopulatedArtist, PopulatedAlbum } from "./tracks.service.js";
import { PaginatedResponse, PaginationParams } from "../../shared/types/index.js";
import { calculatePagination } from "../../shared/utils/index.js";

interface LikeActionResult {
	status: "like" | "dislike" | null;
	trackId: string;
}

interface LikeStatusResult {
	status: "like" | "dislike" | null;
}

interface LikedIdsResult {
	likedIds: string[];
	dislikedIds: string[];
}

interface LikedTrackResponse {
	_id: string;
	title: string;
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	description: string;
	createdAt: Date;
	updatedAt: Date;
	artistId: {
		_id: string;
		name: string;
		imageUrl?: string;
	};
	albumId: {
		_id: string;
		title: string;
		coverImageUrl?: string;
	};
	likedAt: Date;
}

interface PopulatedTrackLike {
	_id: mongoose.Types.ObjectId;
	user_id: mongoose.Types.ObjectId;
	track_id: {
		_id: mongoose.Types.ObjectId;
		title: string;
		duration_in_seconds: number;
		track_number: number;
		genre: string;
		play_count: number;
		cover_image_url?: string;
		description: string;
		created_at: Date;
		updated_at: Date;
		artist_id: PopulatedArtist | null;
		album_id: PopulatedAlbum | null;
	} | null;
	type: "like" | "dislike";
	created_at: Date;
	updated_at: Date;
}

export const trackLikeService = {
	async likeTrack(userId: string, trackId: string): Promise<LikeActionResult> {
		const track = await Track.findById(trackId).exec();
		if (!track) {
			throw new Error("Track not found");
		}

		await TrackLike.findOneAndUpdate(
			{ user_id: userId, track_id: trackId },
			{ $set: { type: "like" } },
			{ upsert: true, new: true },
		).exec();

		return { status: "like" as const, trackId };
	},

	async dislikeTrack(userId: string, trackId: string): Promise<LikeActionResult> {
		const track = await Track.findById(trackId).exec();
		if (!track) {
			throw new Error("Track not found");
		}

		await TrackLike.findOneAndUpdate(
			{ user_id: userId, track_id: trackId },
			{ $set: { type: "dislike" } },
			{ upsert: true, new: true },
		).exec();

		return { status: "dislike" as const, trackId };
	},

	async removeReaction(userId: string, trackId: string): Promise<LikeActionResult> {
		await TrackLike.deleteOne({ user_id: userId, track_id: trackId }).exec();

		return { status: null, trackId };
	},

	async getLikedTracks(
		userId: string,
		paginationParams: PaginationParams,
	): Promise<PaginatedResponse<LikedTrackResponse>> {
		const page = paginationParams.page ?? 1;
		const limit = paginationParams.limit ?? 10;
		const skip = (page - 1) * limit;

		const filter = { user_id: userId, type: "like" as const };

		const [trackLikes, total] = await Promise.all([
			TrackLike.find(filter)
				.sort({ created_at: -1 })
				.skip(skip)
				.limit(limit)
				.populate({
					path: "track_id",
					populate: [
						{ path: "artist_id", select: "name image_url" },
						{ path: "album_id", select: "title cover_image_url" },
					],
				})
				.lean<PopulatedTrackLike[]>()
				.exec(),
			TrackLike.countDocuments(filter).exec(),
		]);

		const items: LikedTrackResponse[] = trackLikes
			.filter((tl) => tl.track_id !== null)
			.map((tl) => {
				const track = tl.track_id!;
				const artist = track.artist_id;
				const album = track.album_id;

				return {
					_id: track._id.toString(),
					title: track.title,
					durationInSeconds: track.duration_in_seconds,
					trackNumber: track.track_number,
					genre: track.genre,
					playCount: track.play_count,
					coverImageUrl: track.cover_image_url,
					description: track.description,
					createdAt: track.created_at,
					updatedAt: track.updated_at,
					artistId: {
						_id: artist?._id?.toString() ?? "",
						name: artist?.name ?? "",
						imageUrl: artist?.image_url,
					},
					albumId: {
						_id: album?._id?.toString() ?? "",
						title: album?.title ?? "",
						coverImageUrl: album?.cover_image_url,
					},
					likedAt: tl.created_at,
				};
			});

		return calculatePagination(items, total, paginationParams);
	},

	async getLikeStatus(userId: string, trackId: string): Promise<LikeStatusResult> {
		const doc = await TrackLike.findOne({ user_id: userId, track_id: trackId })
			.lean()
			.exec();

		return { status: doc?.type ?? null };
	},

	async getLikedIds(userId: string): Promise<LikedIdsResult> {
		const docs = await TrackLike.find({ user_id: userId }).lean().exec();

		const likedIds: string[] = [];
		const dislikedIds: string[] = [];

		for (const doc of docs) {
			const trackIdStr = doc.track_id.toString();
			if (doc.type === "like") {
				likedIds.push(trackIdStr);
			} else {
				dislikedIds.push(trackIdStr);
			}
		}

		return { likedIds, dislikedIds };
	},
};
