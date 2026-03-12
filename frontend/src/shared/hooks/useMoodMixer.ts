import { useState } from "react";
import type { TrackWithPopulated } from "@/shared/types/player.types";

interface UseMoodMixerReturn {
	tracks: TrackWithPopulated[];
	tracksByMood: Record<string, TrackWithPopulated[]>;
	moods: string[];
	visibleMoods: string[];
	selectedMood: string | null;
	setSelectedMood: (mood: string | null) => void;
	moodDescription: string | null;
	isLoading: boolean;
}

const mockTrack = (id: string, title: string, genre: string): TrackWithPopulated =>
	({
		_id: id,
		title,
		durationInSeconds: 200,
		trackNumber: 1,
		genre,
		playCount: 1000,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
		artistId: { _id: "mock-artist-1", name: "Mock Artist", imageUrl: "" },
		albumId: { _id: "mock-album-1", title: "Mock Album", coverImageUrl: "" },
	}) as TrackWithPopulated;

const mockMoods = ["Energetic", "Chill", "Happy", "Focus", "Party"];

const mockTracks: TrackWithPopulated[] = [
	mockTrack("mock-1", "Mock Track 1", "rock"),
	mockTrack("mock-2", "Mock Track 2", "jazz"),
];

const mockTracksByMood: Record<string, TrackWithPopulated[]> = {
	Energetic: [mockTrack("mock-e1", "Mock Energetic", "rock")],
	Chill: [mockTrack("mock-c1", "Mock Chill", "jazz")],
	Happy: [mockTrack("mock-h1", "Mock Happy", "pop")],
	Focus: [mockTrack("mock-f1", "Mock Focus", "electronic")],
	Party: [mockTrack("mock-p1", "Mock Party", "hip-hop")],
};

export function useMoodMixer(): UseMoodMixerReturn {
	const [selectedMood, setSelectedMood] = useState<string | null>(null);

	return {
		tracks: mockTracks,
		tracksByMood: mockTracksByMood,
		moods: mockMoods,
		visibleMoods: mockMoods,
		selectedMood,
		setSelectedMood,
		moodDescription: null,
		isLoading: false,
	};
}
