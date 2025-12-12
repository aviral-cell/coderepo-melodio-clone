import React, {
	createContext,
	useContext,
	useReducer,
	useEffect,
	useCallback,
	useMemo,
} from "react";

import type { PlayerState, PlayerAction } from "../types/player.types";
import type { TrackWithPopulated } from "../types/player.types";
import { playerReducer, initialState } from "./playerReducer";
import { shuffleArray } from "../utils/playerUtils";

export { playerReducer, initialState };

interface PlayerContextType {
	state: PlayerState;
	dispatch: React.Dispatch<PlayerAction>;
	playTrack: (track: TrackWithPopulated) => void;
	playTracks: (tracks: TrackWithPopulated[], startIndex?: number) => void;
	togglePlayPause: () => void;
	next: () => void;
	previous: () => void;
	seek: (seconds: number) => void;
	addToQueue: (track: TrackWithPopulated) => void;
	removeFromQueue: (index: number) => void;
	reorderQueue: (from: number, to: number) => void;
	clearQueue: () => void;
	toggleShuffle: () => void;
	toggleRepeat: () => void;
	setVolume: (volume: number) => void;
	toggleQueue: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(playerReducer, initialState);

	useEffect(() => {
		let interval: ReturnType<typeof setInterval>;

		if (state.isPlaying && state.currentTrack) {
			interval = setInterval(() => {
				dispatch({ type: "TICK" });
			}, 1000);
		}

		return () => {
			if (interval) clearInterval(interval);
		};
	}, [state.isPlaying, state.currentTrack]);

	const saveToRecentlyPlayed = useCallback((track: TrackWithPopulated) => {
		try {
			const STORAGE_KEY = "hackify_clone_recently_played";
			const MAX_RECENT = 10;
			const stored = localStorage.getItem(STORAGE_KEY);
			const recent: TrackWithPopulated[] = stored ? JSON.parse(stored) : [];
			const filtered = recent.filter((t) => t._id !== track._id);
			const updated = [track, ...filtered].slice(0, MAX_RECENT);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
		} catch {
		}
	}, []);

	const playTrack = useCallback(
		(track: TrackWithPopulated) => {
			dispatch({ type: "PLAY_TRACK", payload: track });
			saveToRecentlyPlayed(track);
		},
		[saveToRecentlyPlayed]
	);

	const playTracks = useCallback(
		(tracks: TrackWithPopulated[], startIndex = 0) => {
			dispatch({ type: "PLAY_TRACKS", payload: { tracks, startIndex } });
			if (tracks[startIndex]) {
				saveToRecentlyPlayed(tracks[startIndex]);
			}
		},
		[saveToRecentlyPlayed]
	);

	const togglePlayPause = useCallback(() => {
		dispatch({ type: state.isPlaying ? "PAUSE" : "RESUME" });
	}, [state.isPlaying]);

	const next = useCallback(() => dispatch({ type: "NEXT" }), []);
	const previous = useCallback(() => dispatch({ type: "PREVIOUS" }), []);
	const seek = useCallback(
		(seconds: number) => dispatch({ type: "SEEK", payload: seconds }),
		[]
	);
	const addToQueue = useCallback(
		(track: TrackWithPopulated) => dispatch({ type: "ADD_TO_QUEUE", payload: track }),
		[]
	);
	const removeFromQueue = useCallback(
		(index: number) => dispatch({ type: "REMOVE_FROM_QUEUE", payload: index }),
		[]
	);
	const reorderQueue = useCallback(
		(from: number, to: number) =>
			dispatch({ type: "REORDER_QUEUE", payload: { from, to } }),
		[]
	);
	const clearQueue = useCallback(() => dispatch({ type: "CLEAR_QUEUE" }), []);
	const toggleShuffle = useCallback(() => {
		if (!state.shuffleEnabled && state.currentTrack && state.queue.length > 1) {
			const otherTracks = state.queue.filter((t) => t._id !== state.currentTrack!._id);
			const shuffledOthers = shuffleArray(otherTracks);
			const shuffledQueue = [state.currentTrack, ...shuffledOthers];
			dispatch({ type: "TOGGLE_SHUFFLE", payload: { shuffledQueue } });
		} else {
			dispatch({ type: "TOGGLE_SHUFFLE" });
		}
	}, [state.shuffleEnabled, state.currentTrack, state.queue]);
	const toggleRepeat = useCallback(() => dispatch({ type: "TOGGLE_REPEAT" }), []);
	const setVolume = useCallback(
		(volume: number) => dispatch({ type: "SET_VOLUME", payload: volume }),
		[]
	);
	const toggleQueue = useCallback(() => dispatch({ type: "TOGGLE_QUEUE" }), []);

	const value = useMemo(
		() => ({
			state,
			dispatch,
			playTrack,
			playTracks,
			togglePlayPause,
			next,
			previous,
			seek,
			addToQueue,
			removeFromQueue,
			reorderQueue,
			clearQueue,
			toggleShuffle,
			toggleRepeat,
			setVolume,
			toggleQueue,
		}),
		[
			state,
			playTrack,
			playTracks,
			togglePlayPause,
			next,
			previous,
			seek,
			addToQueue,
			removeFromQueue,
			reorderQueue,
			clearQueue,
			toggleShuffle,
			toggleRepeat,
			setVolume,
			toggleQueue,
		]
	);

	return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextType {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error("usePlayer must be used within a PlayerProvider");
	}
	return context;
}
