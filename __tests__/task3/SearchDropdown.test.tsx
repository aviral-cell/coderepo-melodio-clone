/**
 * @jest-environment jsdom
 */

/**
 * INTRO: SearchDropdown Component Tests
 * SCENARIO: Testing DOM rendering with data-testid attributes
 * EXPECTATION: Component renders correct elements based on state
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUseSearch = jest.fn();

jest.mock("@/shared/hooks/useSearch", () => ({
	useSearch: () => mockUseSearch(),
}));

jest.mock("@/shared/utils", () => ({
	formatDuration: (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	},
}));

import { SearchDropdown } from "@/shared/components/common/SearchDropdown";
import type { TrackWithPopulated } from "@/shared/types/player.types";

const createMockTrack = (id: string, title: string): TrackWithPopulated => ({
	_id: id,
	title,
	durationInSeconds: 180,
	trackNumber: 1,
	audioUrl: `https://www.hackerrank.com/${id}.mp3`,
	createdAt: "2023-01-01T00:00:00Z",
	updatedAt: "2023-01-01T00:00:00Z",
	artistId: {
		_id: "artist-1",
		name: "Test Artist",
		imageUrl: "https://www.hackerrank.com/artist.jpg",
	},
	albumId: {
		_id: "album-1",
		title: "Test Album",
		coverImageUrl: "https://www.hackerrank.com/album.jpg",
	},
});

describe("SearchDropdown", () => {
	const defaultProps = {
		query: "test",
		isOpen: true,
		onClose: jest.fn(),
		onTrackSelect: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("Closed State", () => {
		it("should not render when isOpen is false", () => {
			mockUseSearch.mockReturnValue({
				tracks: [],
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} isOpen={false} />);

			expect(screen.queryByTestId("search-dropdown")).not.toBeInTheDocument();
		});
	});

	describe("Loading State", () => {
		it("should render loading indicator with data-testid", () => {
			mockUseSearch.mockReturnValue({
				tracks: [],
				isLoading: true,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument();
			expect(screen.getByTestId("search-loading")).toBeInTheDocument();
		});
	});

	describe("Error State", () => {
		it("should render error message with data-testid", () => {
			mockUseSearch.mockReturnValue({
				tracks: [],
				isLoading: false,
				error: "Network error",
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument();
			expect(screen.getByTestId("search-error")).toBeInTheDocument();
			expect(screen.getByTestId("search-error")).toHaveTextContent("Network error");
		});
	});

	describe("No Results State", () => {
		it("should render no results message with data-testid", () => {
			mockUseSearch.mockReturnValue({
				tracks: [],
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument();
			expect(screen.getByTestId("search-no-results")).toBeInTheDocument();
			expect(screen.getByTestId("search-no-results")).toHaveTextContent("No results found");
		});
	});

	describe("Results State", () => {
		it("should render results count with data-testid", () => {
			const mockTracks = [
				createMockTrack("track-1", "Thunder"),
				createMockTrack("track-2", "Lightning"),
			];

			mockUseSearch.mockReturnValue({
				tracks: mockTracks,
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-dropdown")).toBeInTheDocument();
			expect(screen.getByTestId("search-results-count")).toBeInTheDocument();
			expect(screen.getByTestId("search-results-count")).toHaveTextContent("2 RESULTS");
		});

		it("should render singular result text for one track", () => {
			mockUseSearch.mockReturnValue({
				tracks: [createMockTrack("track-1", "Thunder")],
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-results-count")).toHaveTextContent("1 RESULT");
		});

		it("should render results list with data-testid", () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")];

			mockUseSearch.mockReturnValue({
				tracks: mockTracks,
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-results-list")).toBeInTheDocument();
		});

		it("should render individual track items with data-testid", () => {
			const mockTracks = [
				createMockTrack("track-1", "Thunder"),
				createMockTrack("track-2", "Lightning"),
			];

			mockUseSearch.mockReturnValue({
				tracks: mockTracks,
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-result-item-track-1")).toBeInTheDocument();
			expect(screen.getByTestId("search-result-item-track-2")).toBeInTheDocument();
		});

		it("should render track title with data-testid", () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")];

			mockUseSearch.mockReturnValue({
				tracks: mockTracks,
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-result-title-track-1")).toBeInTheDocument();
			expect(screen.getByTestId("search-result-title-track-1")).toHaveTextContent("Thunder");
		});

		it("should render track artist info with data-testid", () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")];

			mockUseSearch.mockReturnValue({
				tracks: mockTracks,
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-result-artist-track-1")).toBeInTheDocument();
			expect(screen.getByTestId("search-result-artist-track-1")).toHaveTextContent(
				"Test Artist - Test Album"
			);
		});

		it("should render track duration with data-testid", () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")];

			mockUseSearch.mockReturnValue({
				tracks: mockTracks,
				isLoading: false,
				error: null,
			});

			render(<SearchDropdown {...defaultProps} />);

			expect(screen.getByTestId("search-result-duration-track-1")).toBeInTheDocument();
			expect(screen.getByTestId("search-result-duration-track-1")).toHaveTextContent("3:00");
		});
	});

	describe("Interactions", () => {
		it("should call onTrackSelect and onClose when track is clicked", async () => {
			const mockTracks = [createMockTrack("track-1", "Thunder")];
			const onTrackSelect = jest.fn();
			const onClose = jest.fn();

			mockUseSearch.mockReturnValue({
				tracks: mockTracks,
				isLoading: false,
				error: null,
			});

			render(
				<SearchDropdown
					{...defaultProps}
					onTrackSelect={onTrackSelect}
					onClose={onClose}
				/>
			);

			fireEvent.click(screen.getByTestId("search-result-item-track-1"));

			await waitFor(() => {
				expect(onTrackSelect).toHaveBeenCalledWith(mockTracks[0]);
				expect(onClose).toHaveBeenCalled();
			});
		});
	});
});
