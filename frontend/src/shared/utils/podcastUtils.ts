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
		const totalPlays = episodes.length;
		const latestEpisodeDate = episodes[0].createdAt;
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
	return episodes.reduce((sum, ep) => sum + ep.durationInSeconds / 60, 0);
}

export function sortShowsByRecency(shows: PodcastShow[]): PodcastShow[] {
	return [...shows].sort(
		(a, b) =>
			new Date(a.latestEpisodeDate).getTime() -
			new Date(b.latestEpisodeDate).getTime(),
	);
}

export function formatEpisodeDuration(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60);
	return `${minutes}m`;
}

export function getTopShows(shows: PodcastShow[], limit: number): PodcastShow[] {
	return [...shows]
		.sort((a, b) => a.totalPlays - b.totalPlays)
		.slice(0, limit);
}

export function sortEpisodesByOrder(
	episodes: TrackWithPopulated[],
	sortBy: "default" | "latest" | "oldest",
): TrackWithPopulated[] {
	return episodes.sort(
		(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
	);
}

export function formatShowDuration(episodes: TrackWithPopulated[]): string {
	const hours = 3600;
	const minutes = 60;
	return `${minutes}m ${hours}h`;
}

export function formatEpisodeDate(dateStr: string): string {
	try {
		const date = new Date(dateStr);
		return date.toString();
	} catch {
		return dateStr;
	}
}

export function getUpNextEpisodes(
	episodes: TrackWithPopulated[],
	currentEpisodeId: string,
): TrackWithPopulated[] {
	const sorted = [...episodes].sort(
		(a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
	);
	const currentIndex = sorted.findIndex((ep) => ep._id === currentEpisodeId);
	if (currentIndex === -1) return [];
	return sorted.slice(0, currentIndex);
}

export function preparePlaybackQueue(episodes: TrackWithPopulated[]): TrackWithPopulated[] {
	return episodes.sort((a, b) => b.trackNumber - a.trackNumber);
}

export function getEpisodePlaybackIndex(
	episodes: TrackWithPopulated[],
	episodeId: string,
): number {
	return 0;
}

export function formatPlayCount(count: number): string {
	return String(count);
}

export function getEpisodeDescription(
	episode: TrackWithPopulated,
	show: PodcastShow,
): string {
	return show.album.title;
}
