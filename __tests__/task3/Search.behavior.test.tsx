/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Search Feature Behavior Tests
 * SCENARIO: Testing search with debouncing, loading states, results display, and error handling
 * EXPECTATION: Component displays correct UI states based on actual user interactions
 */

import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock the search service at the API level (not the hook)
const mockSearchService = {
	search: jest.fn(),
};

jest.mock("@/shared/services/search.service", () => ({
	searchService: mockSearchService,
}));

// Mock formatDuration utility for consistent test output
jest.mock("@/shared/utils", () => ({
	formatDuration: (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	},
	cn: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(" "),
}));

import { SearchDropdown } from "@/shared/components/common/SearchDropdown";
import type { TrackWithPopulated } from "@/shared/types/player.types";

const createMockTrack = (
	id: string,
	title: string,
	artistName = "Test Artist",
	albumTitle = "Test Album"
): TrackWithPopulated => ({
	_id: id,
	title,
	durationInSeconds: 180,
	trackNumber: 1,
	genre: "Rock",
	playCount: 1000,
	createdAt: "2023-01-01T00:00:00Z",
	updatedAt: "2023-01-01T00:00:00Z",
	artistId: {
		_id: `artist-${id}`,
		name: artistName,
		imageUrl: `https://hackerrank.com/artist-${id}.jpg`,
	},
	albumId: {
		_id: `album-${id}`,
		title: albumTitle,
		coverImageUrl: `https://hackerrank.com/album-${id}.jpg`,
	},
});

const DEBOUNCE_DELAY = 300;

describe("Search Feature - Behavior Tests", () => {
	const defaultProps = {
		query: "",
		isOpen: true,
		onClose: jest.fn(),
		onTrackSelect: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	describe("Dropdown Visibility", () => {
		it("should not render when isOpen is false", () => {
			mockSearchService.search.mockResolvedValue({ tracks: [] });

			render(<SearchDropdown {...defaultProps} isOpen={false} />);

			expect(screen.queryByTestId("search-dropdown")).not.toBeInTheDocument();
		});

		it("should render when isOpen is true", async () => {
			mockSearchService.search.mockResolvedValue({ tracks: [] });

			render(<SearchDropdown {...defaultProps} isOpen={true} query="" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument();
		});
	});

	describe("Empty Query Behavior", () => {
		it("should show no results message for empty query without API call", async () => {
			render(<SearchDropdown {...defaultProps} query="" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
			expect(screen.getByTestId("search-no-results")).toHaveTextContent("No results found");
			expect(mockSearchService.search).not.toHaveBeenCalled();
		});

		it("should show no results message for whitespace-only query without API call", async () => {
			render(<SearchDropdown {...defaultProps} query="   " />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
			expect(mockSearchService.search).not.toHaveBeenCalled();
		});
	});

	describe("Debounce Behavior", () => {
		it("should debounce API calls when query changes", async () => {
			mockSearchService.search.mockResolvedValue({ tracks: [createMockTrack("1", "Thunder")] });

			const { rerender } = render(<SearchDropdown {...defaultProps} query="" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			mockSearchService.search.mockClear();

			rerender(<SearchDropdown {...defaultProps} query="Thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY - 50);
			});

			expect(mockSearchService.search).not.toHaveBeenCalled();

			await act(async () => {
				jest.advanceTimersByTime(50);
			});

			await waitFor(() => {
				expect(mockSearchService.search).toHaveBeenCalledWith("Thunder");
			});
		});

		it("should call API after debounce delay (300ms)", async () => {
			mockSearchService.search.mockResolvedValue({ tracks: [createMockTrack("1", "Thunder")] });

			render(<SearchDropdown {...defaultProps} query="Thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(mockSearchService.search).toHaveBeenCalledWith("Thunder");
			});
		});

		it("should reset debounce timer on rapid query changes", async () => {
			mockSearchService.search.mockResolvedValue({ tracks: [createMockTrack("1", "Final")] });

			const { rerender } = render(<SearchDropdown {...defaultProps} query="" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			mockSearchService.search.mockClear();

			rerender(<SearchDropdown {...defaultProps} query="Th" />);

			await act(async () => {
				jest.advanceTimersByTime(200);
			});

			expect(mockSearchService.search).not.toHaveBeenCalled();

			rerender(<SearchDropdown {...defaultProps} query="Thu" />);

			await act(async () => {
				jest.advanceTimersByTime(200);
			});

			expect(mockSearchService.search).not.toHaveBeenCalled();

			await act(async () => {
				jest.advanceTimersByTime(100);
			});

			await waitFor(() => {
				expect(mockSearchService.search).toHaveBeenCalledWith("Thu");
				expect(mockSearchService.search).toHaveBeenCalledTimes(1);
			});
		});
	});

	describe("Loading State", () => {
		it("should show loading indicator during API fetch", async () => {
			let resolveSearch: (value: { tracks: TrackWithPopulated[] }) => void;
			const pendingPromise = new Promise<{ tracks: TrackWithPopulated[] }>((resolve) => {
				resolveSearch = resolve;
			});
			mockSearchService.search.mockReturnValue(pendingPromise);

			render(<SearchDropdown {...defaultProps} query="Thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-loading")).toBeInTheDocument();
			});

			await act(async () => {
				resolveSearch!({ tracks: [] });
			});
		});

		it("should hide loading indicator after fetch completes", async () => {
			let resolveSearch: (value: { tracks: TrackWithPopulated[] }) => void;
			const pendingPromise = new Promise<{ tracks: TrackWithPopulated[] }>((resolve) => {
				resolveSearch = resolve;
			});
			mockSearchService.search.mockReturnValue(pendingPromise);

			render(<SearchDropdown {...defaultProps} query="Thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-loading")).toBeInTheDocument();
			});

			await act(async () => {
				resolveSearch!({ tracks: [createMockTrack("1", "Thunder")] });
			});

			await waitFor(() => {
				expect(screen.queryByTestId("search-loading")).not.toBeInTheDocument();
			});
		});
	});

	describe("Results Display", () => {
		it("should display search results after successful API response", async () => {
			const mockTracks = [
				createMockTrack("track-1", "Thunder", "Imagine Dragons", "Evolve"),
				createMockTrack("track-2", "Lightning", "Eric Clapton", "Slowhand"),
			];
			mockSearchService.search.mockResolvedValue({ tracks: mockTracks });

			render(<SearchDropdown {...defaultProps} query="thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-results-list")).toBeInTheDocument();
			});

			expect(screen.getByTestId("search-results-count")).toHaveTextContent("2 RESULTS");
			expect(screen.getByTestId("search-result-item-track-1")).toBeInTheDocument();
			expect(screen.getByTestId("search-result-item-track-2")).toBeInTheDocument();
		});

		it("should display track title correctly", async () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")];
			mockSearchService.search.mockResolvedValue({ tracks: mockTracks });

			render(<SearchDropdown {...defaultProps} query="thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-title-track-1")).toHaveTextContent("Thunder");
			});
		});

		it("should display artist and album info correctly", async () => {
			const mockTracks = [createMockTrack("track-1", "Thunder", "Imagine Dragons", "Evolve")];
			mockSearchService.search.mockResolvedValue({ tracks: mockTracks });

			render(<SearchDropdown {...defaultProps} query="thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-artist-track-1")).toHaveTextContent(
					"Imagine Dragons - Evolve"
				);
			});
		});

		it("should display track duration correctly", async () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")]; // 180 seconds = 3:00
			mockSearchService.search.mockResolvedValue({ tracks: mockTracks });

			render(<SearchDropdown {...defaultProps} query="thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-duration-track-1")).toHaveTextContent("3:00");
			});
		});

		it("should show singular RESULT text for single track", async () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")];
			mockSearchService.search.mockResolvedValue({ tracks: mockTracks });

			render(<SearchDropdown {...defaultProps} query="thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-results-count")).toHaveTextContent("1 RESULT");
			});
		});
	});

	describe("No Results State", () => {
		it("should display 'No results found' when API returns empty array", async () => {
			mockSearchService.search.mockResolvedValue({ tracks: [] });

			render(<SearchDropdown {...defaultProps} query="nonexistenttrack" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
				expect(screen.getByTestId("search-no-results")).toHaveTextContent("No results found");
			});
		});
	});

	describe("Error State", () => {
		it("should display error message when API call fails", async () => {
			mockSearchService.search.mockRejectedValue(new Error("Network error"));

			render(<SearchDropdown {...defaultProps} query="thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-error")).toBeInTheDocument();
				expect(screen.getByTestId("search-error")).toHaveTextContent("Network error");
			});
		});

		it("should display generic error message for non-Error exceptions", async () => {
			mockSearchService.search.mockRejectedValue("String error");

			render(<SearchDropdown {...defaultProps} query="thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-error")).toBeInTheDocument();
				expect(screen.getByTestId("search-error")).toHaveTextContent("Search failed");
			});
		});
	});

	describe("Track Selection", () => {
		it("should call onTrackSelect callback when track is clicked", async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
			const mockTracks = [createMockTrack("track-1", "Thunder")];
			const onTrackSelect = jest.fn();
			mockSearchService.search.mockResolvedValue({ tracks: mockTracks });

			render(
				<SearchDropdown
					{...defaultProps}
					query="thunder"
					onTrackSelect={onTrackSelect}
				/>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-item-track-1")).toBeInTheDocument();
			});

			await user.click(screen.getByTestId("search-result-item-track-1"));

			expect(onTrackSelect).toHaveBeenCalledTimes(1);
			expect(onTrackSelect).toHaveBeenCalledWith(mockTracks[0]);
		});

		it("should call onClose callback when track is clicked", async () => {
			const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
			const mockTracks = [createMockTrack("track-1", "Thunder")];
			const onClose = jest.fn();
			mockSearchService.search.mockResolvedValue({ tracks: mockTracks });

			render(
				<SearchDropdown
					{...defaultProps}
					query="thunder"
					onClose={onClose}
				/>
			);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-item-track-1")).toBeInTheDocument();
			});

			await user.click(screen.getByTestId("search-result-item-track-1"));

			expect(onClose).toHaveBeenCalledTimes(1);
		});
	});

	describe("Query Changes", () => {
		it("should fetch new results when query changes", async () => {
			mockSearchService.search
				.mockResolvedValueOnce({ tracks: [createMockTrack("track-1", "First Result")] })
				.mockResolvedValueOnce({ tracks: [createMockTrack("track-2", "Second Result")] });

			const { rerender } = render(<SearchDropdown {...defaultProps} query="first" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-title-track-1")).toHaveTextContent("First Result");
			});

			rerender(<SearchDropdown {...defaultProps} query="second" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-title-track-2")).toHaveTextContent("Second Result");
			});
		});

		it("should clear error when query becomes empty", async () => {
			mockSearchService.search.mockRejectedValue(new Error("Network error"));

			const { rerender } = render(<SearchDropdown {...defaultProps} query="thunder" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-error")).toBeInTheDocument();
			});

			rerender(<SearchDropdown {...defaultProps} query="" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.queryByTestId("search-error")).not.toBeInTheDocument();
				expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
			});
		});
	});

	describe("Race Condition Handling", () => {
		it("should cancel previous request when query changes rapidly", async () => {
			let resolveFirst: (value: { tracks: TrackWithPopulated[] }) => void;
			const firstPromise = new Promise<{ tracks: TrackWithPopulated[] }>((resolve) => {
				resolveFirst = resolve;
			});

			mockSearchService.search
				.mockReturnValueOnce(firstPromise)
				.mockResolvedValueOnce({ tracks: [createMockTrack("new", "New Result")] });

			const { rerender } = render(<SearchDropdown {...defaultProps} query="first" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-loading")).toBeInTheDocument();
			});

			rerender(<SearchDropdown {...defaultProps} query="second" />);

			await act(async () => {
				jest.advanceTimersByTime(DEBOUNCE_DELAY);
			});

			await act(async () => {
				resolveFirst!({ tracks: [createMockTrack("old", "Old Result")] });
			});

			await waitFor(() => {
				expect(screen.getByTestId("search-result-title-new")).toHaveTextContent("New Result");
				expect(screen.queryByTestId("search-result-title-old")).not.toBeInTheDocument();
			});
		});
	});
});
