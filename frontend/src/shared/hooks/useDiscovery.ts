import { useState } from "react";
import type { TrackWithPopulated } from "@/shared/types/player.types";
import type { Artist } from "@/shared/types";

interface UseDiscoveryReturn {
	allTracks: TrackWithPopulated[];
	artists: Artist[];
	newThisWeek: TrackWithPopulated[];
	popularByLanguage: TrackWithPopulated[];
	popularByGenre: TrackWithPopulated[];
	tracksByEra: TrackWithPopulated[];
	topArtists: Artist[];
	selectedLanguage: string | null;
	setSelectedLanguage: (lang: string | null) => void;
	selectedGenre: string | null;
	setSelectedGenre: (genre: string | null) => void;
	selectedEra: string | null;
	setSelectedEra: (era: string | null) => void;
	isLoading: boolean;
	error: string | null;
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

const mockArtist = (id: string, name: string): Artist => ({
	_id: id,
	name,
	genres: ["rock"],
	followerCount: 5000,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
});

const mockTracks: TrackWithPopulated[] = [
	mockTrack("mock-d1", "Mock Discovery Track 1", "rock"),
	mockTrack("mock-d2", "Mock Discovery Track 2", "pop"),
];

const mockArtists: Artist[] = [
	mockArtist("mock-a1", "Mock Artist 1"),
	mockArtist("mock-a2", "Mock Artist 2"),
];

export function useDiscovery(): UseDiscoveryReturn {
	const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
	const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
	const [selectedEra, setSelectedEra] = useState<string | null>(null);

	return {
		allTracks: mockTracks,
		artists: mockArtists,
		newThisWeek: mockTracks,
		popularByLanguage: mockTracks,
		popularByGenre: mockTracks,
		tracksByEra: mockTracks,
		topArtists: mockArtists,
		selectedLanguage,
		setSelectedLanguage,
		selectedGenre,
		setSelectedGenre,
		selectedEra,
		setSelectedEra,
		isLoading: false,
		error: null,
	};
}
