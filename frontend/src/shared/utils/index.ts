export function formatDuration(seconds: number): string {
	const totalSeconds = Math.floor(seconds);
	const minutes = Math.floor(totalSeconds / 60);
	const remainingSeconds = totalSeconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatDate(date: Date | string): string {
	const d = typeof date === "string" ? new Date(date) : date;
	return new Intl.DateTimeFormat("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	}).format(d);
}
export { DEFAULT_IMAGE, preloadImages, getImageUrl } from "./imageUtils";
export { toTrackWithPopulated } from "./history.utils";

interface BackendTrackResponse {
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
	description?: string;
	createdAt: string;
	updatedAt: string;
}

interface NormalizedTrack {
	_id: string;
	title: string;
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
	durationInSeconds: number;
	trackNumber: number;
	genre: string;
	playCount: number;
	coverImageUrl?: string;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export function normalizeTrack(track: BackendTrackResponse): NormalizedTrack {
	return {
		_id: track.id,
		title: track.title,
		artistId: {
			_id: track.artist.id,
			name: track.artist.name,
			imageUrl: track.artist.imageUrl,
		},
		albumId: {
			_id: track.album.id,
			title: track.album.title,
			coverImageUrl: track.album.coverImageUrl,
		},
		durationInSeconds: track.durationInSeconds,
		trackNumber: track.trackNumber,
		genre: track.genre,
		playCount: track.playCount,
		coverImageUrl: track.coverImageUrl,
		description: track.description,
		createdAt: track.createdAt,
		updatedAt: track.updatedAt,
	};
}

export function normalizeTracks(tracks: BackendTrackResponse[]): NormalizedTrack[] {
	return tracks.map(normalizeTrack);
}
