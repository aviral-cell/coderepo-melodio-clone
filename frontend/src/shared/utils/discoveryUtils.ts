import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { Artist } from "@/shared/types";

export const GENRE_LANGUAGE_MAP: Record<string, string> = {
	rock: "English",
	"r-and-b": "English",
	pop: "Korean",
	jazz: "French",
	electronic: "German",
	"hip-hop": "Spanish",
	classical: "Chinese",
};

export const GENRE_DISPLAY_NAMES: Record<string, string> = {
	rock: "Rock",
	"r-and-b": "R&B",
	pop: "Pop",
	jazz: "Jazz",
	electronic: "Electronic",
	"hip-hop": "Hip-Hop",
	classical: "Classical",
};

export const ERA_RANGES: { label: string; start: number; end: number }[] = [
	{ label: "2020's", start: 2020, end: 2029 },
	{ label: "2010's", start: 2010, end: 2019 },
	{ label: "2000's", start: 2000, end: 2009 },
	{ label: "90's", start: 1990, end: 1999 },
	{ label: "80's", start: 1980, end: 1989 },
];

export const AVAILABLE_LANGUAGES = [...new Set(Object.values(GENRE_LANGUAGE_MAP))];
export const AVAILABLE_GENRES = Object.keys(GENRE_LANGUAGE_MAP);
export const AVAILABLE_ERAS = ERA_RANGES.map((e) => e.label);

export function getGenreDisplayName(genre: string): string {
	return GENRE_DISPLAY_NAMES[genre] || genre.charAt(0).toUpperCase() + genre.slice(1);
}

export function getTrackLanguage(genre: string): string {
	return GENRE_LANGUAGE_MAP[genre] || "Unknown";
}

export function getNewThisWeek(tracks: TrackWithPopulated[], now?: Date): TrackWithPopulated[] {
	const reference = now || new Date();
	const sevenDaysAgo = new Date(reference.getTime() - 7 * 24 * 60 * 60 * 1000);
	return tracks.filter((t) => new Date(t.createdAt) >= sevenDaysAgo);
}

export function getPopularInLanguage(tracks: TrackWithPopulated[], language: string, limit: number): TrackWithPopulated[] {
	const matchingGenres = Object.entries(GENRE_LANGUAGE_MAP)
		.filter(([_, lang]) => lang === language)
		.map(([genre]) => genre);
	return tracks
		.filter((t) => matchingGenres.includes(t.genre))
		.sort((a, b) => b.playCount - a.playCount)
		.slice(0, limit);
}

export function getPopularInGenre(tracks: TrackWithPopulated[], genre: string, limit: number): TrackWithPopulated[] {
	return tracks
		.filter((t) => t.genre === genre)
		.sort((a, b) => b.playCount - a.playCount)
		.slice(0, limit);
}

export function getTracksByEra(
	tracks: TrackWithPopulated[],
	era: string,
	albumDateMap: Record<string, string>,
): TrackWithPopulated[] {
	const range = ERA_RANGES.find((r) => r.label === era);
	if (!range) return [];
	return tracks.filter((t) => {
		const albumId = typeof t.albumId === "object" ? t.albumId._id : t.albumId;
		const dateStr = albumDateMap[albumId];
		if (!dateStr) return false;
		const year = new Date(dateStr).getFullYear();
		return year >= range.start && year <= range.end;
	});
}

export function getTopArtists(artists: Artist[], limit: number): Artist[] {
	return [...artists]
		.filter((a) => !a.genres.includes("podcast"))
		.sort((a, b) => b.followerCount - a.followerCount)
		.slice(0, limit);
}

export function formatLanguageLabel(language: string): string {
	return `Popular in ${language}`;
}
