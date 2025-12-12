/**
 * @jest-environment jsdom
 */

/**
 * INTRO: useRecentlyPlayed Hook Tests
 *
 * Tests for the useRecentlyPlayed hook which manages recently played tracks.
 *
 * SCENARIO: Testing track addition, deduplication, max limit enforcement, and persistence
 * EXPECTATION: Recently played tracks are correctly managed with max 10 tracks
 */

import { renderHook, act } from "@testing-library/react";
import { useRecentlyPlayed } from "@/shared/hooks/useRecentlyPlayed";
import type { TrackWithPopulated } from "@/shared/types/player.types";

const STORAGE_KEY = "hackify_clone_recently_played";

const createMockTrack = (id: string): TrackWithPopulated => ({
	_id: id,
	title: `Track ${id}`,
	durationInSeconds: 180,
	trackNumber: 1,
	genre: "Pop",
	playCount: 0,
	createdAt: "2023-01-01T00:00:00Z",
	updatedAt: "2023-01-01T00:00:00Z",
	artistId: {
		_id: "artist-1",
		name: "Test Artist",
		imageUrl: "http://example.com/artist.jpg",
	},
	albumId: {
		_id: "album-1",
		title: "Test Album",
		coverImageUrl: "http://example.com/album.jpg",
	},
});

describe("useRecentlyPlayed", () => {
	beforeEach(() => {
		localStorage.clear();
		jest.clearAllMocks();
	});

	describe("addToRecentlyPlayed", () => {
		it("should add new track to beginning", () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");

			localStorage.setItem(STORAGE_KEY, JSON.stringify([trackA, trackB]));

			const { result } = renderHook(() => useRecentlyPlayed());

			act(() => {
				result.current.addToRecentlyPlayed(trackC);
			});

			expect(result.current.recentTracks[0]._id).toBe("C");
			expect(result.current.recentTracks[1]._id).toBe("A");
			expect(result.current.recentTracks[2]._id).toBe("B");
		});

		it("should move re-added existing track to front (deduplication)", () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			const trackC = createMockTrack("C");

			localStorage.setItem(STORAGE_KEY, JSON.stringify([trackA, trackB, trackC]));

			const { result } = renderHook(() => useRecentlyPlayed());

			act(() => {
				result.current.addToRecentlyPlayed(trackB);
			});

			expect(result.current.recentTracks.length).toBe(3);
			expect(result.current.recentTracks[0]._id).toBe("B");
			expect(result.current.recentTracks[1]._id).toBe("A");
			expect(result.current.recentTracks[2]._id).toBe("C");
		});

		it("should enforce max 10 tracks limit", () => {
			const existingTracks = Array.from({ length: 10 }, (_, i) =>
				createMockTrack(`track-${i}`)
			);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(existingTracks));

			const { result } = renderHook(() => useRecentlyPlayed());

			const newTrack = createMockTrack("NEW");
			act(() => {
				result.current.addToRecentlyPlayed(newTrack);
			});

			expect(result.current.recentTracks.length).toBe(10);
			expect(result.current.recentTracks[0]._id).toBe("NEW");
			expect(
				result.current.recentTracks.some((t) => t._id === "track-9")
			).toBe(false);
		});

		it("should persist to localStorage", () => {
			const { result } = renderHook(() => useRecentlyPlayed());

			const track = createMockTrack("test-track");
			act(() => {
				result.current.addToRecentlyPlayed(track);
			});

			const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
			expect(stored.length).toBe(1);
			expect(stored[0]._id).toBe("test-track");
		});
	});

	describe("Initial Load", () => {
		it("should load from localStorage on mount", () => {
			const trackA = createMockTrack("A");
			const trackB = createMockTrack("B");
			localStorage.setItem(STORAGE_KEY, JSON.stringify([trackA, trackB]));

			const { result } = renderHook(() => useRecentlyPlayed());

			expect(result.current.recentTracks.length).toBe(2);
			expect(result.current.recentTracks[0]._id).toBe("A");
			expect(result.current.recentTracks[1]._id).toBe("B");
		});

		it("should handle empty localStorage", () => {
			const { result } = renderHook(() => useRecentlyPlayed());

			expect(result.current.recentTracks).toEqual([]);
		});

		it("should handle corrupted localStorage gracefully", () => {
			localStorage.setItem(STORAGE_KEY, "invalid-json{");

			const { result } = renderHook(() => useRecentlyPlayed());

			expect(result.current.recentTracks).toEqual([]);
		});
	});

	describe("clearRecentlyPlayed", () => {
		it("should clear all recent tracks", () => {
			const trackA = createMockTrack("A");
			localStorage.setItem(STORAGE_KEY, JSON.stringify([trackA]));

			const { result } = renderHook(() => useRecentlyPlayed());

			expect(result.current.recentTracks.length).toBe(1);

			act(() => {
				result.current.clearRecentlyPlayed();
			});

			expect(result.current.recentTracks).toEqual([]);
			expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toEqual(
				[]
			);
		});
	});
});
