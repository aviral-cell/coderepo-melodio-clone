import type { PlayerState, PlayerAction, RepeatMode } from "../types/player.types";
import { shuffleArray } from "../utils/playerUtils";

export const initialState: PlayerState = {
	currentTrack: null,
	queue: [],
	originalQueue: [],
	queueIndex: 0,
	isPlaying: false,
	elapsedSeconds: 0,
	shuffleEnabled: false,
	repeatMode: "off",
	volume: 80,
	isQueueOpen: false,
	playCount: 0,
};

export function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
	switch (action.type) {
		case "PLAY_TRACK": {
			const track = action.payload;
			const existingIndex = state.queue.findIndex((t) => t._id === track._id);

			if (existingIndex >= 0) {
				return {
					...state,
					currentTrack: track,
					queueIndex: existingIndex,
					isPlaying: true,
					elapsedSeconds: 0,
					playCount: state.playCount + 1,
				};
			}

			return {
				...state,
				currentTrack: track,
				queue: [...state.queue, track],
				queueIndex: state.queue.length,
				isPlaying: true,
				elapsedSeconds: 0,
				playCount: state.playCount + 1,
			};
		}

		case "PLAY_TRACKS": {
			const { tracks, startIndex } = action.payload;
			return {
				...state,
				queue: tracks,
				queueIndex: startIndex,
				currentTrack: tracks[startIndex] || null,
				isPlaying: true,
				elapsedSeconds: 0,
				shuffleEnabled: false,
				originalQueue: [],
				playCount: state.playCount + 1,
			};
		}

		case "PAUSE":
			return { ...state, isPlaying: false };

		case "RESUME":
			return { ...state, isPlaying: true };

		case "NEXT": {
			if (state.queue.length === 0) return state;

			let nextIndex = state.queueIndex + 1;

			if (nextIndex >= state.queue.length) {
				if (state.repeatMode === "all") {
					nextIndex = 0;
				} else {
					return { ...state, isPlaying: false, elapsedSeconds: 0 };
				}
			}

			return {
				...state,
				queueIndex: nextIndex,
				currentTrack: state.queue[nextIndex],
				elapsedSeconds: 0,
			};
		}

		case "PREVIOUS": {
			if (state.queue.length === 0) return state;

			if (state.elapsedSeconds > 3) {
				return { ...state, elapsedSeconds: 0 };
			}

			const prevIndex = Math.max(0, state.queueIndex - 1);
			return {
				...state,
				queueIndex: prevIndex,
				currentTrack: state.queue[prevIndex],
				elapsedSeconds: 0,
			};
		}

		case "SEEK":
			return {
				...state,
				elapsedSeconds: Math.min(
					action.payload,
					state.currentTrack?.durationInSeconds || 0
				),
			};

		case "ADD_TO_QUEUE":
			return {
				...state,
				queue: [...state.queue, action.payload],
			};

		case "REMOVE_FROM_QUEUE": {
			const removeIndex = action.payload;
			const newQueue = state.queue.filter((_, i) => i !== removeIndex);

			let newQueueIndex = state.queueIndex;
			if (removeIndex < state.queueIndex) {
				newQueueIndex--;
			} else if (removeIndex === state.queueIndex) {
				if (newQueue.length === 0) {
					return {
						...state,
						queue: [],
						currentTrack: null,
						queueIndex: 0,
						isPlaying: false,
						elapsedSeconds: 0,
					};
				}
				newQueueIndex = Math.min(newQueueIndex, newQueue.length - 1);
			}

			return {
				...state,
				queue: newQueue,
				queueIndex: newQueueIndex,
				currentTrack: newQueue[newQueueIndex] || null,
			};
		}

		case "REORDER_QUEUE": {
			const { from, to } = action.payload;
			const newQueue = [...state.queue];
			const [removed] = newQueue.splice(from, 1);
			newQueue.splice(to, 0, removed);

			let newQueueIndex = state.queueIndex;
			if (from === state.queueIndex) {
				newQueueIndex = to;
			} else if (from < state.queueIndex && to >= state.queueIndex) {
				newQueueIndex--;
			} else if (from > state.queueIndex && to <= state.queueIndex) {
				newQueueIndex++;
			}

			return {
				...state,
				queue: newQueue,
				queueIndex: newQueueIndex,
			};
		}

		case "CLEAR_QUEUE":
			return {
				...state,
				queue: state.currentTrack ? [state.currentTrack] : [],
				queueIndex: 0,
				shuffleEnabled: false,
				originalQueue: [],
			};

		case "TOGGLE_SHUFFLE": {
			if (!state.shuffleEnabled) {
				const currentTrack = state.currentTrack;
				if (!currentTrack || state.queue.length <= 1) {
					return { ...state, shuffleEnabled: true, originalQueue: [...state.queue] };
				}
				let newQueue: typeof state.queue;
				if (action.payload?.shuffledQueue) {
					newQueue = action.payload.shuffledQueue;
				} else {
					const otherTracks = state.queue.filter((t) => t._id !== currentTrack._id);
					const shuffledOthers = shuffleArray(otherTracks);
					newQueue = [currentTrack, ...shuffledOthers];
				}

				return {
					...state,
					shuffleEnabled: true,
					originalQueue: [...state.queue],
					queue: newQueue,
					queueIndex: 0,
				};
			} else {
				const currentTrack = state.currentTrack;
				const originalQueue = state.originalQueue.length > 0 ? state.originalQueue : state.queue;

				const newIndex = currentTrack
					? originalQueue.findIndex((t) => t._id === currentTrack._id)
					: 0;

				return {
					...state,
					shuffleEnabled: false,
					queue: originalQueue,
					originalQueue: [],
					queueIndex: newIndex >= 0 ? newIndex : 0,
				};
			}
		}

		case "TOGGLE_REPEAT": {
			const modes: RepeatMode[] = ["off", "all", "one"];
			const currentIndex = modes.indexOf(state.repeatMode);
			const nextMode = modes[(currentIndex + 1) % modes.length];
			return { ...state, repeatMode: nextMode };
		}

		case "SET_VOLUME":
			return { ...state, volume: Math.min(100, Math.max(0, action.payload)) };

		case "TICK": {
			if (!state.currentTrack || !state.isPlaying) return state;

			const newElapsed = state.elapsedSeconds + 1;

			if (newElapsed >= state.currentTrack.durationInSeconds) {
				if (state.repeatMode === "one") {
					return { ...state, elapsedSeconds: 0 };
				}

				const nextIndex = state.queueIndex + 1;
				if (nextIndex >= state.queue.length) {
					if (state.repeatMode === "all") {
						return {
							...state,
							queueIndex: 0,
							currentTrack: state.queue[0],
							elapsedSeconds: 0,
						};
					}
					return { ...state, isPlaying: false, elapsedSeconds: 0 };
				}

				return {
					...state,
					queueIndex: nextIndex,
					currentTrack: state.queue[nextIndex],
					elapsedSeconds: 0,
				};
			}

			return { ...state, elapsedSeconds: newElapsed };
		}

		case "TOGGLE_QUEUE":
			return { ...state, isQueueOpen: !state.isQueueOpen };

		default:
			return state;
	}
}
