import type { TrackWithPopulated } from "@/shared/types/player.types";

export type Variety = "low" | "medium" | "high";
export type Discovery = "familiar" | "blend" | "discover";

export interface MixConfig {
	variety: Variety;
	discovery: Discovery;
	filters: string[];
}

export const DEFAULT_CONFIG: MixConfig = { variety: "medium", discovery: "blend", filters: [] };

export const FILTER_OPTIONS = ["Popular", "Deep cuts", "New releases", "Pump up", "Chill", "Upbeat", "Downbeat", "Focus"];

export const MIX_LIMIT = 20;

export const STEP_ORDER = ["select", "configure", "result"] as const;
export type MixStep = (typeof STEP_ORDER)[number];

export function getUniqueArtists(
	tracks: TrackWithPopulated[],
): Array<{ id: string; name: string; imageUrl?: string; genres?: string[] }> {
	const seen = new Map<string, { id: string; name: string; imageUrl?: string; genres?: string[] }>();

	for (const track of tracks) {
		if (track.genre === "podcast") continue;
		const artist = track.artistId;
		if (!artist?._id || seen.has(artist._id)) continue;
		seen.set(artist._id, {
			id: artist._id,
			name: artist.name,
			imageUrl: artist.imageUrl,
			genres: [],
		});
	}

	return Array.from(seen.values());
}

function scoreTrack(
	track: TrackWithPopulated,
	selectedArtistIds: string[],
	selectedGenres: string[],
	config: MixConfig,
): number {
	let score = 0;
	const isSelectedArtist = selectedArtistIds.includes(track.artistId?._id);
	const isSelectedGenre = selectedGenres.includes(track.genre);

	if (isSelectedArtist) score += 10;
	if (isSelectedGenre) score += 5;

	if (config.variety === "low") {
		if (!isSelectedArtist) return 0;
	} else if (config.variety === "high") {
		score = Math.max(score, 1);
	}

	if (config.discovery === "familiar") {
		score *= track.playCount / 100000;
	} else if (config.discovery === "discover") {
		score *= 1 - track.playCount / 100000;
	}

	for (const filter of config.filters) {
		switch (filter) {
			case "Popular":
				if (track.playCount > 10000) score += 3;
				break;
			case "Chill":
				if (track.genre === "jazz") score += 3;
				break;
			case "Upbeat":
				if (["pop", "electronic"].includes(track.genre)) score += 3;
				break;
			case "Focus":
				if (["jazz", "electronic"].includes(track.genre)) score += 3;
				break;
			case "Pump up":
				if (["rock", "electronic"].includes(track.genre)) score += 3;
				break;
			default:
				break;
		}
	}

	return score;
}

export function generateMix(
	allTracks: TrackWithPopulated[],
	selectedArtistIds: string[],
	selectedGenres: string[],
	config: MixConfig,
	limit: number,
): TrackWithPopulated[] {
	const nonPodcast = allTracks.filter((t) => t.genre !== "podcast");

	const scored = nonPodcast.map((track) => ({
		track,
		score: scoreTrack(track, selectedArtistIds, selectedGenres, config),
	}));

	scored.sort((a, b) => b.score - a.score);

	const allZero = scored.every((s) => s.score === 0);
	if (allZero) {
		scored.sort((a, b) => b.track.playCount - a.track.playCount);
	}

	return scored.slice(0, limit).map((s) => s.track);
}

export function getMixTitle(selectedArtists: Array<{ name: string }>): string {
	if (selectedArtists.length === 0) return "Custom mix";
	const names = selectedArtists.slice(0, 2).map((a) => a.name);
	return names.join(" and ") + " mix";
}

export function getMixCoverImages(selectedArtists: Array<{ imageUrl?: string }>): string[] {
	return selectedArtists
		.slice(0, 4)
		.map((a) => a.imageUrl)
		.filter((url): url is string => url !== undefined);
}
