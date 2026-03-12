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

export const AVAILABLE_LANGUAGES: string[] = [];
export const AVAILABLE_GENRES: string[] = [];
export const AVAILABLE_ERAS: string[] = [];

export function getGenreDisplayName(genre: string): string {
	return genre;
}

export function getTrackLanguage(genre: string): string {
	return "Unknown";
}

export function getNewThisWeek(tracks: TrackWithPopulated[], now?: Date): TrackWithPopulated[] {
	return [];
}

export function getPopularInLanguage(tracks: TrackWithPopulated[], language: string, limit: number): TrackWithPopulated[] {
	return [];
}

export function getPopularInGenre(tracks: TrackWithPopulated[], genre: string, limit: number): TrackWithPopulated[] {
	return [];
}

export function getTracksByEra(
	tracks: TrackWithPopulated[],
	era: string,
	albumDateMap: Record<string, string>,
): TrackWithPopulated[] {
	return [];
}

export function getTopArtists(artists: Artist[], limit: number): Artist[] {
	return [];
}

export function formatLanguageLabel(language: string): string {
	return language;
}
