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

export const AVAILABLE_MOODS: string[] = Object.keys(MOOD_GENRE_MAP);

export function getTracksForMood(
	tracks: TrackWithPopulated[],
	mood: string,
): TrackWithPopulated[] {
	const genres = MOOD_GENRE_MAP[mood];
	if (!genres) return [];
	return tracks.filter((track) => genres.includes(track.genre));
}

export function getTracksGroupedByMood(
	tracks: TrackWithPopulated[],
): Record<string, TrackWithPopulated[]> {
	const grouped: Record<string, TrackWithPopulated[]> = {};
	for (const mood of AVAILABLE_MOODS) {
		grouped[mood] = getTracksForMood(tracks, mood);
	}
	return grouped;
}

export function getMoodImage(mood: string): string {
	return MOOD_IMAGES[mood] || "";
}

export function getMoodDescription(mood: string): string {
	const descriptions: Record<string, string> = {
		Energetic: "High-energy tracks to get you moving",
		Chill: "Relaxing vibes to unwind",
		Happy: "Feel-good tunes to brighten your day",
		Focus: "Instrumental beats to help you concentrate",
		Party: "Bangers to get the party started",
	};
	return descriptions[mood] || "";
}
