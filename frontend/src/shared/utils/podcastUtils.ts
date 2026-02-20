import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { AlbumWithPopulated } from "@/shared/services/albums.service";

export interface PodcastShow {
	album: AlbumWithPopulated;
	episodes: TrackWithPopulated[];
	totalDuration: number;
	episodeCount: number;
	latestEpisodeDate: string;
	totalPlays: number;
}

// ===== BROWSE VIEW FUNCTIONS (correct on both branches) =====

export function groupEpisodesByShow(
	tracks: TrackWithPopulated[],
	albums: AlbumWithPopulated[],
): PodcastShow[] {
	const albumMap = new Map<string, AlbumWithPopulated>();
	albums.forEach((album) => albumMap.set(album._id, album));

	const showMap = new Map<string, TrackWithPopulated[]>();
	tracks.forEach((track) => {
		const albumId = track.albumId?._id;
		if (!albumId) return;
		if (!showMap.has(albumId)) showMap.set(albumId, []);
		showMap.get(albumId)!.push(track);
	});

	const shows: PodcastShow[] = [];
	showMap.forEach((episodes, albumId) => {
		const album = albumMap.get(albumId);
		if (!album) return;
		const totalDuration = calculateShowDuration(episodes);
		const totalPlays = episodes.reduce((sum, ep) => sum + ep.playCount, 0);
		const latestEpisodeDate = episodes.reduce(
			(latest, ep) => (ep.createdAt > latest ? ep.createdAt : latest),
			episodes[0].createdAt,
		);
		shows.push({
			album,
			episodes,
			totalDuration,
			episodeCount: episodes.length,
			latestEpisodeDate,
			totalPlays,
		});
	});
	return shows;
}

export function calculateShowDuration(episodes: TrackWithPopulated[]): number {
	return episodes.reduce((sum, ep) => sum + ep.durationInSeconds, 0);
}

export function sortShowsByRecency(shows: PodcastShow[]): PodcastShow[] {
	return [...shows].sort(
		(a, b) =>
			new Date(b.latestEpisodeDate).getTime() -
			new Date(a.latestEpisodeDate).getTime(),
	);
}

export function formatEpisodeDuration(totalSeconds: number): string {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

export function getTopShows(shows: PodcastShow[], limit: number): PodcastShow[] {
	return [...shows]
		.sort((a, b) => b.totalPlays - a.totalPlays)
		.slice(0, limit);
}

// ===== INTERACTION FUNCTIONS (buggy on base, correct on solution) =====

export function sortEpisodesByOrder(
	episodes: TrackWithPopulated[],
	sortBy: "default" | "latest" | "oldest",
): TrackWithPopulated[] {
	const sorted = [...episodes];
	switch (sortBy) {
		case "default":
			return sorted.sort((a, b) => a.trackNumber - b.trackNumber);
		case "latest":
			return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
		case "oldest":
			return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
		default:
			return sorted;
	}
}

export function formatShowDuration(episodes: TrackWithPopulated[]): string {
	const totalSeconds = episodes.reduce((sum, ep) => sum + ep.durationInSeconds, 0);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	if (hours > 0) return `${hours}h ${minutes}m`;
	return `${minutes}m`;
}

export function formatEpisodeDate(dateStr: string): string {
	const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	const date = new Date(dateStr);
	const month = months[date.getUTCMonth()];
	const day = date.getUTCDate();
	const year = date.getUTCFullYear();
	return `${month} ${day}, ${year}`;
}

export function getUpNextEpisodes(
	episodes: TrackWithPopulated[],
	currentEpisodeId: string,
): TrackWithPopulated[] {
	const sorted = [...episodes].sort((a, b) => a.trackNumber - b.trackNumber);
	const currentIndex = sorted.findIndex((ep) => ep._id === currentEpisodeId);
	if (currentIndex === -1) return [];
	return sorted.slice(currentIndex + 1);
}

export function preparePlaybackQueue(episodes: TrackWithPopulated[]): TrackWithPopulated[] {
	return [...episodes].sort((a, b) => a.trackNumber - b.trackNumber);
}

export function getEpisodePlaybackIndex(
	episodes: TrackWithPopulated[],
	episodeId: string,
): number {
	const sorted = [...episodes].sort((a, b) => a.trackNumber - b.trackNumber);
	const index = sorted.findIndex((ep) => ep._id === episodeId);
	return index >= 0 ? index : 0;
}

export function formatPlayCount(count: number): string {
	if (count >= 1000000) {
		const val = count / 1000000;
		return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
	}
	if (count >= 1000) {
		const val = count / 1000;
		return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
	}
	return String(count);
}

export function getEpisodeDescription(
	episode: TrackWithPopulated,
	_show: PodcastShow,
): string {
	return episode.description || "No description available";
}
