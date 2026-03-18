import { useState, useCallback } from "react";
import { playlistService } from "../services/playlist.service";
import type { TrackWithPopulated } from "../types/player.types";

interface UsePlaylistOperationsReturn {
	reorderTracks: (fromIndex: number, toIndex: number) => Promise<void>;
	removeTrack: (trackId: string) => Promise<void>;
	isReordering: boolean;
	isRemoving: boolean;
}

export function usePlaylistOperations(
	playlistId: string,
	tracks: TrackWithPopulated[],
	setPlaylist: (tracks: TrackWithPopulated[]) => void,
	onError?: (error: Error) => void
): UsePlaylistOperationsReturn {
	const [isReordering, setIsReordering] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	const reorderTracks = useCallback(
		async (fromIndex: number, toIndex: number) => {
			if (fromIndex === toIndex) {
				return;
			}

			const originalTracks = [...tracks];
			const newTracks = [...tracks];
			const [movedTrack] = newTracks.splice(fromIndex, 1);
			newTracks.splice(toIndex, 0, movedTrack);

			setPlaylist(newTracks);
			setIsReordering(true);

			try {
				const trackIds = newTracks.map((t) => t._id);
				await playlistService.reorderTracks(playlistId, trackIds);
			} catch (error) {
				setPlaylist(originalTracks);
				const err = error instanceof Error ? error : new Error("Failed to reorder tracks");
				onError?.(err);
				throw err;
			} finally {
				setIsReordering(false);
			}
		},
		[playlistId, tracks, setPlaylist, onError]
	);

	const removeTrack = useCallback(
		async (trackId: string) => {
			const originalTracks = [...tracks];
			const newTracks = tracks.filter((t) => t._id !== trackId);

			setPlaylist(newTracks);
			setIsRemoving(true);

			try {
				await playlistService.removeTrack(playlistId, trackId);
			} catch (error) {
				setPlaylist(originalTracks);
				const err = error instanceof Error ? error : new Error("Failed to remove track");
				onError?.(err);
				throw err;
			} finally {
				setIsRemoving(false);
			}
		},
		[playlistId, tracks, setPlaylist, onError]
	);

	return {
		reorderTracks,
		removeTrack,
		isReordering,
		isRemoving,
	};
}
