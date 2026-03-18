import mongoose from "mongoose";
import { PlayHistory, IPlayHistoryDocument } from "./history.model.js";
import { Track } from "../tracks/track.model.js";

const MAX_HISTORY_SIZE = 50;

interface PopulatedArtist {
	_id: mongoose.Types.ObjectId;
	name: string;
	image_url?: string;
}

interface PopulatedAlbum {
	_id: mongoose.Types.ObjectId;
	title: string;
	cover_image_url?: string;
}

interface PopulatedTrack {
	_id: mongoose.Types.ObjectId;
	title: string;
	artist_id: PopulatedArtist | null;
	album_id: PopulatedAlbum | null;
	duration_in_seconds: number;
	track_number: number;
	genre: string;
	play_count: number;
	cover_image_url?: string;
	created_at: Date;
	updated_at: Date;
}

interface PopulatedPlayHistory {
	_id: mongoose.Types.ObjectId;
	user_id: mongoose.Types.ObjectId;
	track_id: PopulatedTrack;
	played_at: Date;
	created_at: Date;
	updated_at: Date;
}

export interface TrackResponse {
	id: string;
	title: string;
	artist: {
		id: string;
		name: string;
		imageUrl?: string;
	};
	album: {
		id: string;
		title: string;
		coverImageUrl?: string;
	};
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	playedAt: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface RecentlyPlayedResponse {
	tracks: TrackResponse[];
	total: number;
}

function transformTrack(history: PopulatedPlayHistory): TrackResponse {
	const track = history.track_id;
	const artist = track.artist_id;
	const album = track.album_id;

	return {
		id: track._id.toString(),
		title: track.title,
		artist: {
			id: artist?._id?.toString() ?? "",
			name: artist?.name ?? "",
			imageUrl: artist?.image_url,
		},
		album: {
			id: album?._id?.toString() ?? "",
			title: album?.title ?? "",
			coverImageUrl: album?.cover_image_url,
		},
		durationInSeconds: track.duration_in_seconds,
		trackNumber: track.track_number,
		genre: track.genre,
		playCount: track.play_count,
		coverImageUrl: track.cover_image_url,
		playedAt: history.played_at,
		createdAt: track.created_at,
		updatedAt: track.updated_at,
	};
}

export const historyService = {
	async recordPlay(
		userId: string,
		trackId: string,
	): Promise<IPlayHistoryDocument> {
		const trackObjectId = new mongoose.Types.ObjectId(trackId);
		const track = await Track.findById(trackObjectId).lean().exec();

		if (!track) {
			throw new Error("Track not found");
		}

		const userObjectId = new mongoose.Types.ObjectId(userId);

		const entry = await PlayHistory.create({
			user_id: userObjectId,
			track_id: trackObjectId,
			played_at: new Date(),
		});

		const historyCount = await PlayHistory.countDocuments({
			user_id: userObjectId,
		}).exec();

		if (historyCount > MAX_HISTORY_SIZE) {
			const excessCount = historyCount - MAX_HISTORY_SIZE;

			const oldestEntries = await PlayHistory.find({ user_id: userObjectId })
				.sort({ played_at: 1 })
				.limit(excessCount)
				.select("_id")
				.lean()
				.exec();

			const idsToDelete = oldestEntries.map((e) => e._id);

			await PlayHistory.deleteMany({ _id: { $in: idsToDelete } }).exec();
		}

		return entry;
	},

	async getRecentlyPlayed(
		userId: string,
		limit: number = 20,
		offset: number = 0,
	): Promise<RecentlyPlayedResponse> {
		const effectiveLimit = Math.min(Math.max(limit, 1), 50);
		const effectiveOffset = Math.max(offset, 0);
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const history = await PlayHistory.find({ user_id: userObjectId })
			.sort({ played_at: -1 })
			.skip(effectiveOffset)
			.limit(effectiveLimit)
			.populate<{ track_id: PopulatedTrack }>({
				path: "track_id",
				populate: [
					{ path: "artist_id", select: "name image_url" },
					{ path: "album_id", select: "title cover_image_url" },
				],
			})
			.lean<PopulatedPlayHistory[]>()
			.exec();

		const validHistory = history.filter((h) => h.track_id !== null);

		const total = await PlayHistory.countDocuments({
			user_id: userObjectId,
		}).exec();

		return {
			tracks: validHistory.map((h) => transformTrack(h)),
			total,
		};
	},

	async clearHistory(userId: string): Promise<void> {
		const userObjectId = new mongoose.Types.ObjectId(userId);
		await PlayHistory.deleteMany({ user_id: userObjectId }).exec();
	},
};
