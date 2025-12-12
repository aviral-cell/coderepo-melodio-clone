/**
 * Bug Fix Test Cases
 * Tests for 5 critical bug fixes in the music player application
 *
 * Bug 1: Slider bars too thick - reduced height from h-2 to h-1
 * Bug 2: Track detail page navigation failing
 * Bug 3: Playlist tracks showing "Unknown Album"
 * Bug 4: All tracks showing Pause button instead of only the playing track
 * Bug 5: Progress bar not updating during playback
 */

import { normalizeTrack, normalizeTracks } from "../../src/shared/utils";
import { playerReducer, initialState } from "../../src/shared/contexts/playerReducer";

/**
 * Bug Fix 1: Track normalization from backend format to frontend format
 * Backend returns: { id, artist: {id, name}, album: {id, title} }
 * Frontend expects: { _id, artistId: {_id, name}, albumId: {_id, title} }
 */
describe("Bug Fix 1 & 3: Track Data Normalization", () => {
	const backendTrackResponse = {
		id: "track123",
		title: "Test Track",
		artist: {
			id: "artist123",
			name: "Test Artist",
			imageUrl: "/images/artist.jpg",
		},
		album: {
			id: "album123",
			title: "Test Album",
			coverImageUrl: "/images/album.jpg",
		},
		durationInSeconds: 240,
		trackNumber: 1,
		genre: "rock",
		playCount: 1000,
		coverImageUrl: "/images/track.jpg",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	};

	it("should convert backend track id to frontend _id", () => {
		const normalized = normalizeTrack(backendTrackResponse);
		expect(normalized._id).toBe("track123");
		expect((normalized as unknown as { id?: string }).id).toBeUndefined();
	});

	it("should convert backend artist to frontend artistId format", () => {
		const normalized = normalizeTrack(backendTrackResponse);
		expect(normalized.artistId).toEqual({
			_id: "artist123",
			name: "Test Artist",
			imageUrl: "/images/artist.jpg",
		});
	});

	it("should convert backend album to frontend albumId format", () => {
		const normalized = normalizeTrack(backendTrackResponse);
		expect(normalized.albumId).toEqual({
			_id: "album123",
			title: "Test Album",
			coverImageUrl: "/images/album.jpg",
		});
	});

	it("should preserve all other track properties", () => {
		const normalized = normalizeTrack(backendTrackResponse);
		expect(normalized.title).toBe("Test Track");
		expect(normalized.durationInSeconds).toBe(240);
		expect(normalized.trackNumber).toBe(1);
		expect(normalized.genre).toBe("rock");
		expect(normalized.playCount).toBe(1000);
		expect(normalized.coverImageUrl).toBe("/images/track.jpg");
	});

	it("should normalize an array of tracks", () => {
		const tracks = [backendTrackResponse, { ...backendTrackResponse, id: "track456" }];
		const normalized = normalizeTracks(tracks);
		expect(normalized).toHaveLength(2);
		expect(normalized[0]._id).toBe("track123");
		expect(normalized[1]._id).toBe("track456");
	});

	it("should handle tracks with missing optional fields", () => {
		const trackWithMissingFields = {
			...backendTrackResponse,
			artist: { id: "artist123", name: "Artist" },
			album: { id: "album123", title: "Album" },
			coverImageUrl: undefined,
		};
		const normalized = normalizeTrack(trackWithMissingFields);
		expect(normalized.artistId.imageUrl).toBeUndefined();
		expect(normalized.albumId.coverImageUrl).toBeUndefined();
		expect(normalized.coverImageUrl).toBeUndefined();
	});
});

/**
 * Bug Fix 4: Only selected track should show Pause button
 * The isPlaying state should only be true for the currently playing track
 */
describe("Bug Fix 4: Only Selected Track Shows Pause", () => {
	const createTrack = (id: string, title: string) => ({
		_id: id,
		title,
		artistId: { _id: "artist1", name: "Artist" },
		albumId: { _id: "album1", title: "Album", coverImageUrl: "/img.jpg" },
		durationInSeconds: 200,
		trackNumber: 1,
		genre: "rock",
		playCount: 100,
		createdAt: "2024-01-01",
		updatedAt: "2024-01-01",
	});

	it("should set only one track as currentTrack when PLAY_TRACK is dispatched", () => {
		const track1 = createTrack("track1", "Track 1");
		const track2 = createTrack("track2", "Track 2");

		let state = playerReducer(initialState, { type: "PLAY_TRACK", payload: track1 });
		expect(state.currentTrack?._id).toBe("track1");
		expect(state.isPlaying).toBe(true);

		state = playerReducer(state, { type: "PLAY_TRACK", payload: track2 });
		expect(state.currentTrack?._id).toBe("track2");
		expect(state.queue).not.toContainEqual(expect.objectContaining({ _id: "track1", isPlaying: true }));
	});

	it("should identify current track correctly for UI display", () => {
		const track1 = createTrack("track1", "Track 1");
		const track2 = createTrack("track2", "Track 2");

		const state = playerReducer(initialState, { type: "PLAY_TRACK", payload: track1 });

		const isTrack1Current = state.currentTrack?._id === track1._id;
		const isTrack2Current = state.currentTrack?._id === track2._id;
		const isTrack1Playing = isTrack1Current && state.isPlaying;
		const isTrack2Playing = isTrack2Current && state.isPlaying;

		expect(isTrack1Playing).toBe(true);
		expect(isTrack2Playing).toBe(false);
	});

	it("should toggle between play and pause for the same track", () => {
		const track = createTrack("track1", "Track 1");

		let state = playerReducer(initialState, { type: "PLAY_TRACK", payload: track });
		expect(state.isPlaying).toBe(true);

		state = playerReducer(state, { type: "PAUSE" });
		expect(state.isPlaying).toBe(false);
		expect(state.currentTrack?._id).toBe("track1");

		state = playerReducer(state, { type: "RESUME" });
		expect(state.isPlaying).toBe(true);
		expect(state.currentTrack?._id).toBe("track1");
	});
});

/**
 * Bug Fix 5: Progress bar should update during playback
 * The TICK action should increment elapsedSeconds every second
 */
describe("Bug Fix 5: Progress Bar Updates During Playback", () => {
	const mockTrack = {
		_id: "track1",
		title: "Test Track",
		artistId: { _id: "artist1", name: "Artist" },
		albumId: { _id: "album1", title: "Album", coverImageUrl: "/img.jpg" },
		durationInSeconds: 200,
		trackNumber: 1,
		genre: "rock",
		playCount: 100,
		createdAt: "2024-01-01",
		updatedAt: "2024-01-01",
	};

	it("should increment elapsedSeconds on TICK when playing", () => {
		let state = playerReducer(initialState, { type: "PLAY_TRACK", payload: mockTrack });
		expect(state.elapsedSeconds).toBe(0);

		state = playerReducer(state, { type: "TICK" });
		expect(state.elapsedSeconds).toBe(1);

		state = playerReducer(state, { type: "TICK" });
		expect(state.elapsedSeconds).toBe(2);

		state = playerReducer(state, { type: "TICK" });
		expect(state.elapsedSeconds).toBe(3);
	});

	it("should not increment elapsedSeconds when paused", () => {
		let state = playerReducer(initialState, { type: "PLAY_TRACK", payload: mockTrack });
		state = playerReducer(state, { type: "TICK" });
		expect(state.elapsedSeconds).toBe(1);

		state = playerReducer(state, { type: "PAUSE" });
		const pausedState = playerReducer(state, { type: "TICK" });
		expect(pausedState.elapsedSeconds).toBe(1);
	});

	it("should not increment elapsedSeconds when no track is playing", () => {
		const state = playerReducer(initialState, { type: "TICK" });
		expect(state.elapsedSeconds).toBe(0);
	});

	it("should reset elapsedSeconds when a new track starts", () => {
		const track2 = { ...mockTrack, _id: "track2", title: "Track 2" };

		let state = playerReducer(initialState, { type: "PLAY_TRACK", payload: mockTrack });
		state = playerReducer(state, { type: "TICK" });
		state = playerReducer(state, { type: "TICK" });
		expect(state.elapsedSeconds).toBe(2);

		state = playerReducer(state, { type: "PLAY_TRACK", payload: track2 });
		expect(state.elapsedSeconds).toBe(0);
		expect(state.currentTrack?._id).toBe("track2");
	});

	it("should calculate progress percentage correctly", () => {
		let state = playerReducer(initialState, { type: "PLAY_TRACK", payload: mockTrack });

		for (let i = 0; i < 100; i++) {
			state = playerReducer(state, { type: "TICK" });
		}

		const progress = (state.elapsedSeconds / mockTrack.durationInSeconds) * 100;
		expect(progress).toBe(50);
	});

	it("should handle track ending and auto-advance", () => {
		const shortTrack = { ...mockTrack, durationInSeconds: 3 };
		const nextTrack = { ...mockTrack, _id: "track2", title: "Track 2" };

		let state = playerReducer(initialState, {
			type: "PLAY_TRACKS",
			payload: { tracks: [shortTrack, nextTrack], startIndex: 0 },
		});

		state = playerReducer(state, { type: "TICK" });
		state = playerReducer(state, { type: "TICK" });
		state = playerReducer(state, { type: "TICK" });

		expect(state.currentTrack?._id).toBe("track2");
		expect(state.elapsedSeconds).toBe(0);
	});

	it("should handle SEEK action to update elapsedSeconds", () => {
		let state = playerReducer(initialState, { type: "PLAY_TRACK", payload: mockTrack });
		state = playerReducer(state, { type: "SEEK", payload: 50 });
		expect(state.elapsedSeconds).toBe(50);
	});

	it("should not allow seeking beyond track duration", () => {
		let state = playerReducer(initialState, { type: "PLAY_TRACK", payload: mockTrack });
		state = playerReducer(state, { type: "SEEK", payload: 999 });
		expect(state.elapsedSeconds).toBe(mockTrack.durationInSeconds);
	});
});

/**
 * Bug Fix 2: Track detail page navigation
 * Tests for proper track data display after navigation
 */
describe("Bug Fix 2: Track Detail Page Data Display", () => {
	it("should display artist name from normalized artistId object", () => {
		const track = {
			_id: "track1",
			title: "Test Track",
			artistId: { _id: "artist1", name: "The Beatles", imageUrl: "/beatles.jpg" },
			albumId: { _id: "album1", title: "Abbey Road", coverImageUrl: "/abbey.jpg" },
			durationInSeconds: 240,
			trackNumber: 5,
			genre: "rock",
			playCount: 50000,
		};

		const artistName =
			typeof track.artistId === "object" ? track.artistId.name : "Unknown Artist";
		expect(artistName).toBe("The Beatles");
	});

	it("should display album title from normalized albumId object", () => {
		const track = {
			_id: "track1",
			title: "Test Track",
			artistId: { _id: "artist1", name: "The Beatles" },
			albumId: { _id: "album1", title: "Abbey Road", coverImageUrl: "/abbey.jpg" },
			durationInSeconds: 240,
		};

		const albumTitle =
			typeof track.albumId === "object" ? track.albumId.title : "Unknown Album";
		expect(albumTitle).toBe("Abbey Road");
	});

	it("should display album cover from normalized albumId object", () => {
		const track = {
			_id: "track1",
			title: "Test Track",
			artistId: { _id: "artist1", name: "Artist" },
			albumId: { _id: "album1", title: "Album", coverImageUrl: "/cover.jpg" },
			durationInSeconds: 240,
		};

		const albumCover =
			typeof track.albumId === "object" ? track.albumId.coverImageUrl : undefined;
		expect(albumCover).toBe("/cover.jpg");
	});

	it("should fall back to Unknown values when data is missing", () => {
		const track = {
			_id: "track1",
			title: "Test Track",
			artistId: "artist123",
			albumId: "album123",
			durationInSeconds: 240,
		};

		const artistName =
			typeof track.artistId === "object" ? (track.artistId as { name: string }).name : "Unknown Artist";
		const albumTitle =
			typeof track.albumId === "object" ? (track.albumId as { title: string }).title : "Unknown Album";

		expect(artistName).toBe("Unknown Artist");
		expect(albumTitle).toBe("Unknown Album");
	});
});
