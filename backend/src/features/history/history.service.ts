import mongoose from "mongoose";
import { IPlayHistoryDocument } from "./history.model.js";

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
	): Promise<void> {
	},

	async getRecentlyPlayed(
		userId: string,
		limit: number = 20,
		offset: number = 0,
	): Promise<RecentlyPlayedResponse> {
		return { tracks: [], total: 0 };
	},

	async clearHistory(userId: string): Promise<void> {
	},
};
