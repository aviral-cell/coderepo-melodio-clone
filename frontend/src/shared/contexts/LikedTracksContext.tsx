import {
	createContext,
	useContext,
	useReducer,
	useEffect,
	useCallback,
	useMemo,
	type ReactNode,
} from "react";

import { trackLikeService } from "@/shared/services/track-like.service";

interface LikedTracksState {
	likedIds: Set<string>;
	dislikedIds: Set<string>;
	isLoading: boolean;
	error: string | null;
}

type LikedTracksAction =
	| { type: "SET_IDS"; likedIds: string[]; dislikedIds: string[] }
	| { type: "TOGGLE_LIKE"; trackId: string }
	| { type: "TOGGLE_DISLIKE"; trackId: string }
	| { type: "REMOVE_REACTION"; trackId: string }
	| { type: "SET_LOADING"; isLoading: boolean }
	| { type: "SET_ERROR"; error: string | null };

const initialState: LikedTracksState = {
	likedIds: new Set<string>(),
	dislikedIds: new Set<string>(),
	isLoading: true,
	error: null,
};

function likedTracksReducer(state: LikedTracksState, action: LikedTracksAction): LikedTracksState {
	switch (action.type) {
		case "SET_IDS":
			return {
				...state,
				likedIds: new Set(action.likedIds),
				dislikedIds: new Set(action.dislikedIds),
				isLoading: false,
				error: null,
			};

		case "TOGGLE_LIKE": {
			const { trackId } = action;
			const newLikedIds = new Set(state.likedIds);
			const newDislikedIds = new Set(state.dislikedIds);

			if (newLikedIds.has(trackId)) {
				newLikedIds.delete(trackId);
			} else {
				newDislikedIds.delete(trackId);
				newLikedIds.add(trackId);
			}

			return {
				...state,
				likedIds: newLikedIds,
				dislikedIds: newDislikedIds,
			};
		}

		case "TOGGLE_DISLIKE": {
			const { trackId } = action;
			const newLikedIds = new Set(state.likedIds);
			const newDislikedIds = new Set(state.dislikedIds);

			if (newDislikedIds.has(trackId)) {
				newDislikedIds.delete(trackId);
			} else {
				newLikedIds.delete(trackId);
				newDislikedIds.add(trackId);
			}

			return {
				...state,
				likedIds: newLikedIds,
				dislikedIds: newDislikedIds,
			};
		}

		case "REMOVE_REACTION": {
			const { trackId } = action;
			const newLikedIds = new Set(state.likedIds);
			const newDislikedIds = new Set(state.dislikedIds);
			newLikedIds.delete(trackId);
			newDislikedIds.delete(trackId);

			return {
				...state,
				likedIds: newLikedIds,
				dislikedIds: newDislikedIds,
			};
		}

		case "SET_LOADING":
			return { ...state, isLoading: action.isLoading };

		case "SET_ERROR":
			return { ...state, error: action.error };

		default:
			return state;
	}
}

interface LikedTracksContextType {
	likedIds: Set<string>;
	dislikedIds: Set<string>;
	likedCount: number;
	isLoading: boolean;
	error: string | null;
	isLiked: (trackId: string) => boolean;
	isDisliked: (trackId: string) => boolean;
	toggleLike: (trackId: string) => Promise<void>;
	toggleDislike: (trackId: string) => Promise<void>;
	removeReaction: (trackId: string) => Promise<void>;
}

const LikedTracksContext = createContext<LikedTracksContextType | null>(null);

export function LikedTracksProvider({ children }: { children: ReactNode }) {
	const [state, dispatch] = useReducer(likedTracksReducer, initialState);

	useEffect(() => {
		let cancelled = false;

		async function fetchIds() {
			try {
				const data = await trackLikeService.getLikedIds();
				if (!cancelled) {
					dispatch({
						type: "SET_IDS",
						likedIds: data.likedIds,
						dislikedIds: data.dislikedIds,
					});
				}
			} catch (err) {
				if (!cancelled) {
					dispatch({
						type: "SET_ERROR",
						error: err instanceof Error ? err.message : "Failed to load liked tracks",
					});
					dispatch({ type: "SET_LOADING", isLoading: false });
				}
			}
		}

		fetchIds();
		return () => {
			cancelled = true;
		};
	}, []);

	const isLiked = useCallback(
		(trackId: string): boolean => state.likedIds.has(trackId),
		[state.likedIds],
	);

	const isDisliked = useCallback(
		(trackId: string): boolean => state.dislikedIds.has(trackId),
		[state.dislikedIds],
	);

	const toggleLike = useCallback(
		async (trackId: string): Promise<void> => {
			const wasLiked = state.likedIds.has(trackId);
			dispatch({ type: "TOGGLE_LIKE", trackId });

			try {
				if (wasLiked) {
					await trackLikeService.removeReaction(trackId);
				} else {
					await trackLikeService.likeTrack(trackId);
				}
			} catch {
				dispatch({ type: "TOGGLE_LIKE", trackId });
			}
		},
		[state.likedIds],
	);

	const toggleDislike = useCallback(
		async (trackId: string): Promise<void> => {
			const wasDisliked = state.dislikedIds.has(trackId);
			dispatch({ type: "TOGGLE_DISLIKE", trackId });

			try {
				if (wasDisliked) {
					await trackLikeService.removeReaction(trackId);
				} else {
					await trackLikeService.dislikeTrack(trackId);
				}
			} catch {
				dispatch({ type: "TOGGLE_DISLIKE", trackId });
			}
		},
		[state.dislikedIds],
	);

	const removeReaction = useCallback(
		async (trackId: string): Promise<void> => {
			const prevLiked = state.likedIds.has(trackId);
			const prevDisliked = state.dislikedIds.has(trackId);
			dispatch({ type: "REMOVE_REACTION", trackId });

			try {
				await trackLikeService.removeReaction(trackId);
			} catch {
				if (prevLiked) {
					dispatch({ type: "TOGGLE_LIKE", trackId });
				} else if (prevDisliked) {
					dispatch({ type: "TOGGLE_DISLIKE", trackId });
				}
			}
		},
		[state.likedIds, state.dislikedIds],
	);

	const value = useMemo<LikedTracksContextType>(
		() => ({
			likedIds: state.likedIds,
			dislikedIds: state.dislikedIds,
			likedCount: state.likedIds.size,
			isLoading: state.isLoading,
			error: state.error,
			isLiked,
			isDisliked,
			toggleLike,
			toggleDislike,
			removeReaction,
		}),
		[
			state.likedIds,
			state.dislikedIds,
			state.isLoading,
			state.error,
			isLiked,
			isDisliked,
			toggleLike,
			toggleDislike,
			removeReaction,
		],
	);

	return (
		<LikedTracksContext.Provider value={value}>
			{children}
		</LikedTracksContext.Provider>
	);
}

export function useLikedTracksContext(): LikedTracksContextType {
	const context = useContext(LikedTracksContext);
	if (!context) {
		throw new Error("useLikedTracksContext must be used within a LikedTracksProvider");
	}
	return context;
}
