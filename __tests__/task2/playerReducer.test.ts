/**
 * @jest-environment jsdom
 */
/**
 * @file playerReducer.test.ts
 * @description Unit tests for the player reducer that manages music playback state.
 *
 * Test Coverage:
 * - TOGGLE_SHUFFLE: Queue randomization with current track preservation at index 0
 * - TOGGLE_REPEAT: Cycling through 'off' -> 'all' -> 'one' -> 'off'
 * - TICK: Progress tracking and auto-advance based on repeat mode
 */
import { playerReducer, initialState } from "@/shared/contexts/playerReducer";
import type { PlayerState } from "@/shared/types/player.types";
import type { TrackWithPopulated } from "@/shared/types/player.types";

// Mock shuffleArray to return predictable results (reverse order)
jest.mock("@/shared/utils/playerUtils", () => ({
	shuffleArray: <T>(arr: T[]): T[] => [...arr].reverse(),
}));

/**
 * Factory function to create mock tracks with populated artist and album data.
 */
function createMockTrack(
	id: string,
	title: string,
	durationInSeconds = 180
): TrackWithPopulated {
	return {
		_id: id,
		title,
		artistId: { _id: `artist-${id}`, name: `Artist ${id}`, imageUrl: "/artist.jpg" },
		albumId: { _id: `album-${id}`, title: `Album ${id}`, coverImageUrl: "/cover.jpg" },
		durationInSeconds,
		trackNumber: 1,
		genre: "Pop",
		playCount: 100,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
}

describe("playerReducer", () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	describe("TOGGLE_SHUFFLE", () => {
		it("should enable shuffle and preserve current track at index 0", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const state: PlayerState = {
				...initialState,
				currentTrack: track2,
				queue: [track1, track2, track3],
				queueIndex: 1,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.queue[0]).toEqual(track2);
			expect(newState.queueIndex).toBe(0);
			expect(newState.currentTrack).toEqual(track2);
		});

		it("should store original queue when enabling shuffle", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const originalQueue = [track1, track2, track3];
			const state: PlayerState = {
				...initialState,
				currentTrack: track1,
				queue: originalQueue,
				queueIndex: 0,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.originalQueue).toEqual(originalQueue);
			expect(newState.originalQueue).toHaveLength(3);
		});

		it("should restore original queue order when disabling shuffle", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const originalQueue = [track1, track2, track3];
			const shuffledQueue = [track2, track3, track1];
			const state: PlayerState = {
				...initialState,
				currentTrack: track2,
				queue: shuffledQueue,
				originalQueue,
				queueIndex: 0,
				shuffleEnabled: true,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(false);
			expect(newState.queue).toEqual(originalQueue);
			expect(newState.originalQueue).toEqual([]);
		});

		it("should use pre-computed shuffledQueue from payload when provided", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const track4 = createMockTrack("4", "Track 4");
			const state: PlayerState = {
				...initialState,
				currentTrack: track2,
				queue: [track1, track2, track3, track4],
				queueIndex: 1,
				isPlaying: true,
			};

			const preComputedQueue = [track2, track4, track1, track3];

			const newState = playerReducer(state, {
				type: "TOGGLE_SHUFFLE",
				payload: { shuffledQueue: preComputedQueue },
			});

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.queue).toEqual(preComputedQueue);
			expect(newState.queue[0]).toEqual(track2);
			expect(newState.queueIndex).toBe(0);
		});

		it("should fall back to internal shuffle when no payload provided", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const state: PlayerState = {
				...initialState,
				currentTrack: track1,
				queue: [track1, track2, track3],
				queueIndex: 0,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.queue[0]).toEqual(track1);
			expect(newState.queue).toHaveLength(3);
			// Mock shuffle reverses array, so [track2, track3] reversed = [track3, track2]
			expect(newState.queue).toEqual([track1, track3, track2]);
		});

		it("should not shuffle when queue has only 1 track", () => {
			const track1 = createMockTrack("1", "Track 1");
			const state: PlayerState = {
				...initialState,
				currentTrack: track1,
				queue: [track1],
				queueIndex: 0,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.queue).toEqual([track1]);
		});

		it("should update queueIndex to match currentTrack position after unshuffle", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const originalQueue = [track1, track2, track3];
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track3,
				queue: shuffledQueue,
				originalQueue,
				queueIndex: 0,
				shuffleEnabled: true,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(false);
			expect(newState.queue).toEqual(originalQueue);
			expect(newState.queueIndex).toBe(2);
			expect(newState.currentTrack).toEqual(track3);
		});

		it("should enable shuffle and preserve current track at index 0 when starting from first track", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const track4 = createMockTrack("4", "Track 4");
			const state: PlayerState = {
				...initialState,
				currentTrack: track1,
				queue: [track1, track2, track3, track4],
				queueIndex: 0,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.queue[0]).toEqual(track1);
			expect(newState.queueIndex).toBe(0);
			expect(newState.queue).toHaveLength(4);
		});

		it("should enable shuffle from last track and set queueIndex to 0", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const track4 = createMockTrack("4", "Track 4");
			const track5 = createMockTrack("5", "Track 5");
			const track6 = createMockTrack("6", "Track 6");
			const state: PlayerState = {
				...initialState,
				currentTrack: track6,
				queue: [track1, track2, track3, track4, track5, track6],
				queueIndex: 5,
				isPlaying: true,
			};

			const preComputedQueue = [track6, track3, track1, track5, track2, track4];

			const newState = playerReducer(state, {
				type: "TOGGLE_SHUFFLE",
				payload: { shuffledQueue: preComputedQueue },
			});

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.queue[0]).toEqual(track6);
			expect(newState.queueIndex).toBe(0);
			expect(newState.queue).toHaveLength(6);
		});

		it("should handle empty queue gracefully when enabling shuffle", () => {
			const state: PlayerState = {
				...initialState,
				currentTrack: null,
				queue: [],
				queueIndex: 0,
				isPlaying: false,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.queue).toEqual([]);
			expect(newState.originalQueue).toEqual([]);
		});

		it("should handle no currentTrack gracefully when enabling shuffle", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const originalQueue = [track1, track2, track3];
			const state: PlayerState = {
				...initialState,
				currentTrack: null,
				queue: originalQueue,
				queueIndex: 0,
				isPlaying: false,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.queue).toEqual(originalQueue);
			expect(newState.originalQueue).toEqual(originalQueue);
		});

		it("should fallback to current queue when originalQueue is empty on disable", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const currentQueue = [track2, track1, track3];
			const state: PlayerState = {
				...initialState,
				currentTrack: track2,
				queue: currentQueue,
				originalQueue: [],
				queueIndex: 0,
				shuffleEnabled: true,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "TOGGLE_SHUFFLE" });

			expect(newState.shuffleEnabled).toBe(false);
			expect(newState.queue).toEqual(currentQueue);
		});
	});

	describe("TOGGLE_REPEAT", () => {
		it("should cycle repeat mode from 'off' to 'all' to 'one' to 'off'", () => {
			const stateOff: PlayerState = {
				...initialState,
				repeatMode: "off",
			};

			const stateAll = playerReducer(stateOff, { type: "TOGGLE_REPEAT" });
			expect(stateAll.repeatMode).toBe("all");

			const stateOne = playerReducer(stateAll, { type: "TOGGLE_REPEAT" });
			expect(stateOne.repeatMode).toBe("one");

			const stateBackToOff = playerReducer(stateOne, { type: "TOGGLE_REPEAT" });
			expect(stateBackToOff.repeatMode).toBe("off");
		});

		it("should handle repeat mode cycling correctly through all modes", () => {
			const expectedCycle = ["off", "all", "one", "off", "all", "one"] as const;
			let currentState: PlayerState = { ...initialState, repeatMode: "off" };

			for (let i = 1; i < expectedCycle.length; i++) {
				currentState = playerReducer(currentState, { type: "TOGGLE_REPEAT" });
				expect(currentState.repeatMode).toBe(expectedCycle[i]);
			}
		});
	});

	describe("TICK", () => {
		it("should increment elapsedSeconds when playing", () => {
			const track = createMockTrack("1", "Track 1", 180);
			const state: PlayerState = {
				...initialState,
				currentTrack: track,
				queue: [track],
				queueIndex: 0,
				isPlaying: true,
				elapsedSeconds: 10,
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.elapsedSeconds).toBe(11);
			expect(newState.isPlaying).toBe(true);
		});

		it("should restart track when repeatMode is 'one' and track ends", () => {
			const track = createMockTrack("1", "Track 1", 180);
			const state: PlayerState = {
				...initialState,
				currentTrack: track,
				queue: [track],
				queueIndex: 0,
				isPlaying: true,
				elapsedSeconds: 179,
				repeatMode: "one",
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.elapsedSeconds).toBe(0);
			expect(newState.isPlaying).toBe(true);
			expect(newState.currentTrack).toEqual(track);
			expect(newState.queueIndex).toBe(0);
		});

		it("should advance to next track when current track ends with repeatMode 'off'", () => {
			const track1 = createMockTrack("1", "Track 1", 180);
			const track2 = createMockTrack("2", "Track 2", 200);
			const state: PlayerState = {
				...initialState,
				currentTrack: track1,
				queue: [track1, track2],
				queueIndex: 0,
				isPlaying: true,
				elapsedSeconds: 179,
				repeatMode: "off",
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.currentTrack).toEqual(track2);
			expect(newState.queueIndex).toBe(1);
			expect(newState.elapsedSeconds).toBe(0);
			expect(newState.isPlaying).toBe(true);
		});

		it("should loop to first track when repeatMode is 'all' and queue ends", () => {
			const track1 = createMockTrack("1", "Track 1", 180);
			const track2 = createMockTrack("2", "Track 2", 200);
			const state: PlayerState = {
				...initialState,
				currentTrack: track2,
				queue: [track1, track2],
				queueIndex: 1,
				isPlaying: true,
				elapsedSeconds: 199,
				repeatMode: "all",
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.currentTrack).toEqual(track1);
			expect(newState.queueIndex).toBe(0);
			expect(newState.elapsedSeconds).toBe(0);
			expect(newState.isPlaying).toBe(true);
		});

		it("should NOT increment elapsedSeconds when paused", () => {
			const track = createMockTrack("1", "Track 1", 180);
			const state: PlayerState = {
				...initialState,
				currentTrack: track,
				queue: [track],
				queueIndex: 0,
				isPlaying: false,
				elapsedSeconds: 50,
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.elapsedSeconds).toBe(50);
			expect(newState.isPlaying).toBe(false);
		});

		it("should return unchanged state when no currentTrack", () => {
			const state: PlayerState = {
				...initialState,
				currentTrack: null,
				queue: [],
				queueIndex: 0,
				isPlaying: true,
				elapsedSeconds: 0,
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState).toEqual(state);
			expect(newState.elapsedSeconds).toBe(0);
		});

		it("should stop playback at end of queue with repeatMode 'off'", () => {
			const track1 = createMockTrack("1", "Track 1", 180);
			const state: PlayerState = {
				...initialState,
				currentTrack: track1,
				queue: [track1],
				queueIndex: 0,
				isPlaying: true,
				elapsedSeconds: 179,
				repeatMode: "off",
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.isPlaying).toBe(false);
			expect(newState.elapsedSeconds).toBe(0);
		});
	});

	describe("TOGGLE_SHUFFLE with TICK integration", () => {
		it("should advance to next shuffled track when current track ends", () => {
			const track1 = createMockTrack("1", "Track 1", 180);
			const track2 = createMockTrack("2", "Track 2", 180);
			const track3 = createMockTrack("3", "Track 3", 180);
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track3,
				queue: shuffledQueue,
				queueIndex: 0,
				isPlaying: true,
				elapsedSeconds: 179,
				shuffleEnabled: true,
				repeatMode: "off",
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.currentTrack).toEqual(track1);
			expect(newState.queueIndex).toBe(1);
			expect(newState.elapsedSeconds).toBe(0);
			expect(newState.isPlaying).toBe(true);
		});

		it("should stop playback at end of shuffled queue with repeatMode 'off'", () => {
			const track1 = createMockTrack("1", "Track 1", 180);
			const track2 = createMockTrack("2", "Track 2", 180);
			const track3 = createMockTrack("3", "Track 3", 180);
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track2,
				queue: shuffledQueue,
				queueIndex: 2,
				isPlaying: true,
				elapsedSeconds: 179,
				shuffleEnabled: true,
				repeatMode: "off",
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.isPlaying).toBe(false);
			expect(newState.elapsedSeconds).toBe(0);
		});

		it("should loop to first shuffled track at end of queue with repeatMode 'all'", () => {
			const track1 = createMockTrack("1", "Track 1", 180);
			const track2 = createMockTrack("2", "Track 2", 180);
			const track3 = createMockTrack("3", "Track 3", 180);
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track2,
				queue: shuffledQueue,
				queueIndex: 2,
				isPlaying: true,
				elapsedSeconds: 179,
				shuffleEnabled: true,
				repeatMode: "all",
			};

			const newState = playerReducer(state, { type: "TICK" });

			expect(newState.currentTrack).toEqual(track3);
			expect(newState.queueIndex).toBe(0);
			expect(newState.isPlaying).toBe(true);
		});

		it("should continue playback when shuffle enabled from last track and track ends", () => {
			const track1 = createMockTrack("1", "Track 1", 180);
			const track2 = createMockTrack("2", "Track 2", 180);
			const track3 = createMockTrack("3", "Track 3", 180);
			const track4 = createMockTrack("4", "Track 4", 180);
			const track5 = createMockTrack("5", "Track 5", 180);
			const track6 = createMockTrack("6", "Track 6", 180);
			const originalQueue = [track1, track2, track3, track4, track5, track6];

			// Step 1: PLAY_TRACKS with startIndex=5 (last track)
			let state = playerReducer(initialState, {
				type: "PLAY_TRACKS",
				payload: { tracks: originalQueue, startIndex: 5 },
			});

			expect(state.currentTrack).toEqual(track6);
			expect(state.queueIndex).toBe(5);

			// Step 2: TOGGLE_SHUFFLE with pre-computed queue (track6 at index 0)
			const shuffledQueue = [track6, track3, track1, track5, track2, track4];
			state = playerReducer(state, {
				type: "TOGGLE_SHUFFLE",
				payload: { shuffledQueue },
			});

			expect(state.shuffleEnabled).toBe(true);
			expect(state.queue[0]).toEqual(track6);
			expect(state.queueIndex).toBe(0);

			// Step 3: Simulate track ending (set elapsedSeconds near end, then TICK)
			state = {
				...state,
				elapsedSeconds: 179,
			};
			state = playerReducer(state, { type: "TICK" });

			expect(state.isPlaying).toBe(true);
			expect(state.queueIndex).toBe(1);
			expect(state.currentTrack).toEqual(track3);
			expect(state.elapsedSeconds).toBe(0);
		});
	});

	describe("NEXT and PREVIOUS with shuffle", () => {
		it("should advance in shuffled queue order on NEXT", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track3,
				queue: shuffledQueue,
				queueIndex: 0,
				shuffleEnabled: true,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "NEXT" });

			expect(newState.queueIndex).toBe(1);
			expect(newState.currentTrack).toEqual(track1);
		});

		it("should go back in shuffled queue order on PREVIOUS", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track2,
				queue: shuffledQueue,
				queueIndex: 2,
				shuffleEnabled: true,
				elapsedSeconds: 1,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "PREVIOUS" });

			expect(newState.queueIndex).toBe(1);
			expect(newState.currentTrack).toEqual(track1);
		});
	});

	describe("Shuffle state persistence", () => {
		it("should reset shuffle state on PLAY_TRACKS", () => {
			const oldTrack1 = createMockTrack("old1", "Old Track 1");
			const oldTrack2 = createMockTrack("old2", "Old Track 2");
			const newTrack1 = createMockTrack("new1", "New Track 1");
			const newTrack2 = createMockTrack("new2", "New Track 2");
			const state: PlayerState = {
				...initialState,
				currentTrack: oldTrack1,
				queue: [oldTrack2, oldTrack1],
				originalQueue: [oldTrack1, oldTrack2],
				queueIndex: 1,
				shuffleEnabled: true,
				isPlaying: true,
			};

			const newState = playerReducer(state, {
				type: "PLAY_TRACKS",
				payload: { tracks: [newTrack1, newTrack2], startIndex: 0 },
			});

			expect(newState.shuffleEnabled).toBe(false);
			expect(newState.originalQueue).toEqual([]);
			expect(newState.queue).toEqual([newTrack1, newTrack2]);
		});

		it("should preserve shuffle state on PLAY_TRACK", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track3,
				queue: shuffledQueue,
				originalQueue: [track1, track2, track3],
				queueIndex: 0,
				shuffleEnabled: true,
				isPlaying: true,
			};

			const newState = playerReducer(state, {
				type: "PLAY_TRACK",
				payload: track1,
			});

			expect(newState.shuffleEnabled).toBe(true);
			expect(newState.currentTrack).toEqual(track1);
		});

		it("should append to end of shuffled queue on ADD_TO_QUEUE", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const track4 = createMockTrack("4", "Track 4");
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track3,
				queue: shuffledQueue,
				queueIndex: 0,
				shuffleEnabled: true,
				isPlaying: true,
			};

			const newState = playerReducer(state, {
				type: "ADD_TO_QUEUE",
				payload: track4,
			});

			expect(newState.queue).toEqual([track3, track1, track2, track4]);
			expect(newState.shuffleEnabled).toBe(true);
		});

		it("should reset shuffle state on CLEAR_QUEUE", () => {
			const track1 = createMockTrack("1", "Track 1");
			const track2 = createMockTrack("2", "Track 2");
			const track3 = createMockTrack("3", "Track 3");
			const shuffledQueue = [track3, track1, track2];
			const state: PlayerState = {
				...initialState,
				currentTrack: track3,
				queue: shuffledQueue,
				originalQueue: [track1, track2, track3],
				queueIndex: 0,
				shuffleEnabled: true,
				isPlaying: true,
			};

			const newState = playerReducer(state, { type: "CLEAR_QUEUE" });

			expect(newState.shuffleEnabled).toBe(false);
			expect(newState.originalQueue).toEqual([]);
		});
	});
});
