import { useState, useEffect } from "react";
import { useDebounce } from "./useDebounce";
import { searchService } from "../services/search.service";
import type { TrackWithPopulated } from "../types/player.types";

interface UseSearchReturn {
	tracks: TrackWithPopulated[];
	isLoading: boolean;
	error: string | null;
}

const DEBOUNCE_DELAY = 300;

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

		let cancelled = false;

		const fetchResults = async () => {
			setIsLoading(true);
			setError(null);

			try {
				const result = await searchService.search(trimmedQuery);
				if (!cancelled) {
					setTracks(result.tracks);
				}
			} catch (err) {
				if (!cancelled) {
					const errorMessage =
						err instanceof Error ? err.message : "Search failed";
					setError(errorMessage);
					setTracks([]);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		};

		fetchResults();

		return () => {
			cancelled = true;
		};
	}, [debouncedQuery]);

	return { tracks, isLoading, error };
}
