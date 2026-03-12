import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";
import type { TrackWithPopulated } from "../types/player.types";

interface UseSearchReturn {
	tracks: TrackWithPopulated[];
	isLoading: boolean;
	error: string | null;
}

const DEBOUNCE_DELAY = 300;

const mockTracks: TrackWithPopulated[] = [
	{
		_id: "mock-1",
		title: "Mock Song 1",
		durationInSeconds: 180,
		artist: { _id: "artist-1", name: "Mock Artist", imageUrl: "" },
		album: { _id: "album-1", title: "Mock Album", coverImageUrl: "" },
	},
	{
		_id: "mock-2",
		title: "Mock Song 2",
		durationInSeconds: 240,
		artist: { _id: "artist-1", name: "Mock Artist", imageUrl: "" },
		album: { _id: "album-1", title: "Mock Album", coverImageUrl: "" },
	},
];

export function useSearch(query: string): UseSearchReturn {
	const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const debouncedQuery = useDebounce(query, DEBOUNCE_DELAY);

	useEffect(() => {
		const trimmedQuery = debouncedQuery.trim();

		if (!trimmedQuery) {
			setTracks([]);
			setError(null);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);
		setTracks(mockTracks);
		setIsLoading(false);
	}, [debouncedQuery]);

	return { tracks, isLoading, error };
}
