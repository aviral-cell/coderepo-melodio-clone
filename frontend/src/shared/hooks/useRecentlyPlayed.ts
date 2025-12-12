import { useState, useCallback, useEffect } from "react";
import type { TrackWithPopulated } from "../types/player.types";

const STORAGE_KEY = "melodio_clone_recently_played";
const MAX_RECENT_TRACKS = 10;

interface UseRecentlyPlayedReturn {
	recentTracks: TrackWithPopulated[];
	addToRecentlyPlayed: (track: TrackWithPopulated) => void;
	clearRecentlyPlayed: () => void;
}

export function useRecentlyPlayed(): UseRecentlyPlayedReturn {
	const [recentTracks, setRecentTracks] = useState<TrackWithPopulated[]>(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : [];
		} catch {
			return [];
		}
	});

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(recentTracks));
		} catch {
		}
	}, [recentTracks]);

	const addToRecentlyPlayed = useCallback((track: TrackWithPopulated) => {
		setRecentTracks((prev) => {
			const filtered = prev.filter((t) => t._id !== track._id);
			const updated = [track, ...filtered].slice(0, MAX_RECENT_TRACKS);
			return updated;
		});
	}, []);

	const clearRecentlyPlayed = useCallback(() => {
		setRecentTracks([]);
	}, []);

	return {
		recentTracks,
		addToRecentlyPlayed,
		clearRecentlyPlayed,
	};
}
