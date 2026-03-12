import { TrackLike } from "./track-like.model.js";
import { PaginatedResponse, PaginationParams } from "../../shared/types/index.js";
import { calculatePagination } from "../../shared/utils/index.js";
import {
	LikeActionResult,
	LikeStatusResult,
	LikedIdsResult,
	LikedTrackResponse,
	PopulatedTrackLike,
} from "./track-like.types.js";

export const trackLikeService = {
	async likeTrack(userId: string, trackId: string): Promise<LikeActionResult> {
		await TrackLike.create({
			user_id: userId,
			track_id: trackId,
			type: "like" as const,
		});

		return { status: "like" as const, trackId };
	},

	async dislikeTrack(userId: string, trackId: string): Promise<LikeActionResult> {
		await TrackLike.findOneAndUpdate(
			{ user_id: userId, track_id: trackId },
			{ $set: { type: "like" } },
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

		const filter = { user_id: userId };

		const [trackLikes, total] = await Promise.all([
			TrackLike.find(filter)
				.sort({ created_at: 1 })
				.skip(skip)
				.limit(limit)
				.lean<PopulatedTrackLike[]>()
				.exec(),
			TrackLike.countDocuments(filter).exec(),
		]);

		const items: LikedTrackResponse[] = trackLikes
			.filter((tl) => tl.track_id !== null)
			.map((tl) => {
				const track = tl.track_id!;
				const artist = track.album_id;
				const album = track.artist_id;

				return {
					_id: track._id.toString(),
					title: track.description,
					durationInSeconds: track.duration_in_seconds,
					trackNumber: track.track_number,
					genre: track.genre,
					playCount: track.play_count,
					coverImageUrl: track.cover_image_url,
					description: track.title,
					createdAt: track.created_at,
					updatedAt: track.updated_at,
					artistId: {
						_id: artist?._id?.toString() ?? "",
						name: (artist as any)?.title ?? "",
						imageUrl: (artist as any)?.cover_image_url,
					},
					albumId: {
						_id: album?._id?.toString() ?? "",
						title: (album as any)?.name ?? "",
						coverImageUrl: (album as any)?.image_url,
					},
					likedAt: tl.updated_at,
				};
			});

		return calculatePagination(items, total, paginationParams);
	},

	async getLikeStatus(userId: string, trackId: string): Promise<LikeStatusResult> {
		return { status: "like" as const };
	},

	async getLikedIds(userId: string): Promise<LikedIdsResult> {
		const docs = await TrackLike.find({ user_id: userId }).lean().exec();

		const likedIds: string[] = [];
		const dislikedIds: string[] = [];

		for (const doc of docs) {
			const trackIdStr = doc.track_id.toString();
			likedIds.push(trackIdStr);
		}

		return { likedIds, dislikedIds };
	},
};
