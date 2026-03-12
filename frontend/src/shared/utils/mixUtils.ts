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
	return [];
}
export function scoreTrack(
	track: TrackWithPopulated,
	selectedArtistIds: string[],
	selectedGenres: string[],
	config: MixConfig,
): number {
	return 0;
}

export function generateMix(
	allTracks: TrackWithPopulated[],
	selectedArtistIds: string[],
	selectedGenres: string[],
	config: MixConfig,
	limit: number,
): TrackWithPopulated[] {
	return [];
}

export function getMixTitle(selectedArtists: Array<{ name: string }>): string {
	return "";
}

export function getMixCoverImages(selectedArtists: Array<{ imageUrl?: string }>): string[] {
	return [];
}
