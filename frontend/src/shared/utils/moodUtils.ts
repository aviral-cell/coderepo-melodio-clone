import type { TrackWithPopulated } from "@/shared/types/player.types";

export const MOOD_GENRE_MAP: Record<string, string[]> = {
	Energetic: ["rock", "electronic"],
	Chill: ["jazz"],
	Happy: ["pop"],
	Focus: ["electronic", "jazz"],
	Party: ["pop", "hip-hop"],
};

export const MOOD_IMAGES: Record<string, string> = {
	Energetic: "/images/moods/energetic.jpg",
	Chill: "/images/moods/chill.jpg",
	Happy: "/images/moods/happy.jpg",
	Focus: "/images/moods/focus.jpg",
	Party: "/images/moods/party.jpg",
};

export function getTracksForMood(
	tracks: TrackWithPopulated[],
	mood: string,
): TrackWithPopulated[] {
	return [];
}

export function getTracksGroupedByMood(
	tracks: TrackWithPopulated[],
): Record<string, TrackWithPopulated[]> {
	return {};
}

export function getMoodImage(mood: string): string {
	return "";
}

export function getMoodDescription(mood: string): string {
	const descriptions: Record<string, string> = {
		Energetic: "High-energy tracks to get you moving",
		Chill: "Relaxing vibes to unwind",
		Happy: "Feel-good tunes to brighten your day",
		Focus: "Instrumental beats to help you concentrate",
		Party: "Bangers to get the party started",
	};
	return "";
}
