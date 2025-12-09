/**
 * @file useSearch.test.ts
 * @description Unit tests for the useSearch custom hook.
 *
 * This hook provides search functionality with debouncing to reduce API calls.
 * It manages loading states, error handling, and result caching.
 *
 * @module __tests__/task4/useSearch.test
 *
 * Test Coverage:
 * - Empty query handling: No API calls for empty/whitespace queries
 * - Debouncing: Integration with useDebounce hook (300ms delay)
 * - Search execution: Loading states and result handling
 * - Error handling: API error propagation and generic error messages
 *
 * Dependencies:
 * - searchService: API service for search requests
 * - useDebounce: Hook that delays value changes (mocked for testing)
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSearch } from '@/shared/hooks/useSearch';
import { searchService } from '@/shared/services/search.service';
import { useDebounce } from '@/shared/hooks/useDebounce';

// Mock the search service to avoid actual API calls
jest.mock('@/shared/services/search.service', () => ({
  searchService: {
    search: jest.fn(),
  },
}));

// Mock useDebounce to return the value immediately for testing
// This allows testing search behavior without waiting for debounce delays
jest.mock('@/shared/hooks/useDebounce', () => ({
  useDebounce: jest.fn((value: string) => value),
}));

const mockSearchService = searchService as jest.Mocked<typeof searchService>;
const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>;

// Mock track data for testing
const mockTrack = {
  _id: 'track-1',
  title: 'Test Song',
  durationInSeconds: 180,
  audioFileUrl: '/audio/test.mp3',
  artistId: {
    _id: 'artist-1',
    name: 'Test Artist',
    bio: 'Test bio',
    imageUrl: '/images/artist.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  albumId: {
    _id: 'album-1',
    title: 'Test Album',
    coverImageUrl: '/images/album.jpg',
    releaseYear: 2024,
    artistId: 'artist-1',
    trackIds: ['track-1'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Test Suite: useSearch Hook
 *
 * Tests the search functionality including debouncing, API calls, and error handling.
 * Uses mocked services for deterministic testing without network dependencies.
 */
describe('useSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDebounce.mockImplementation((value: string) => value);
  });

  /**
   * Empty Query Handling Tests
   *
   * Tests that the hook correctly handles empty, null, or whitespace queries
   * without making unnecessary API calls.
   */
  describe('empty query handling', () => {
    // Verifies that empty queries return empty results without API calls
    it('should return empty tracks array when query is empty', () => {
      const { result } = renderHook(() => useSearch(''));

      expect(result.current.tracks).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    // Verifies that the API is not called for empty string queries
    it('should not call search service when query is empty', () => {
      renderHook(() => useSearch(''));

      expect(mockSearchService.search).not.toHaveBeenCalled();
    });

    // Verifies that whitespace-only queries are treated as empty
    it('should not call search service when query is only whitespace', () => {
      renderHook(() => useSearch('   '));

      expect(mockSearchService.search).not.toHaveBeenCalled();
    });
  });

  /**
   * Debouncing Tests
   *
   * Tests the integration with useDebounce hook.
   * Verifies that search uses the debounced value, not the raw input.
   */
  describe('debouncing', () => {
    // Verifies that useDebounce is called with the correct delay parameter
    it('should use useDebounce hook with 300ms delay', () => {
      renderHook(() => useSearch('test query'));

      expect(mockUseDebounce).toHaveBeenCalledWith('test query', 300);
    });

    // Verifies that the debounced value (not raw input) is used for API calls
    it('should use debounced value for search', async () => {
      mockUseDebounce.mockImplementation(() => 'debounced');
      mockSearchService.search.mockResolvedValue({ tracks: [mockTrack] });

      renderHook(() => useSearch('original'));

      await waitFor(() => {
        expect(mockSearchService.search).toHaveBeenCalledWith('debounced');
      });
    });
  });

  /**
   * Search Execution Tests
   *
   * Tests the actual search process including loading states,
   * API calls, and result handling.
   */
  describe('search execution', () => {
    // Verifies that isLoading reflects the pending state during API calls
    it('should set isLoading to true while fetching', async () => {
      let resolveSearch: (value: { tracks: typeof mockTrack[] }) => void;
      const searchPromise = new Promise<{ tracks: typeof mockTrack[] }>((resolve) => {
        resolveSearch = resolve;
      });
      mockSearchService.search.mockReturnValue(searchPromise);

      const { result } = renderHook(() => useSearch('test'));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await act(async () => {
        resolveSearch!({ tracks: [mockTrack] });
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    // Verifies that search results are correctly mapped to the tracks state
    it('should return tracks from search service', async () => {
      mockSearchService.search.mockResolvedValue({ tracks: [mockTrack] });

      const { result } = renderHook(() => useSearch('test'));

      await waitFor(() => {
        expect(result.current.tracks).toEqual([mockTrack]);
      });
    });

    // Verifies that the search service is called with the correct query string
    it('should call search service with the query', async () => {
      mockSearchService.search.mockResolvedValue({ tracks: [] });

      renderHook(() => useSearch('my search query'));

      await waitFor(() => {
        expect(mockSearchService.search).toHaveBeenCalledWith('my search query');
      });
    });
  });

  /**
   * Error Handling Tests
   *
   * Tests error scenarios including API failures, network errors,
   * and error state clearing.
   */
  describe('error handling', () => {
    // Verifies that Error objects have their message extracted
    it('should set error when search fails', async () => {
      mockSearchService.search.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSearch('test'));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.tracks).toEqual([]);
      });
    });

    // Verifies that non-Error exceptions get a generic error message
    it('should set generic error message for non-Error exceptions', async () => {
      mockSearchService.search.mockRejectedValue('Something went wrong');

      const { result } = renderHook(() => useSearch('test'));

      await waitFor(() => {
        expect(result.current.error).toBe('Search failed');
      });
    });

    // Verifies that error state is cleared when the user clears the search input
    it('should clear error when query becomes empty', async () => {
      mockSearchService.search.mockRejectedValue(new Error('Network error'));

      const { result, rerender } = renderHook(
        ({ query }) => useSearch(query),
        { initialProps: { query: 'test' } }
      );

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
      });

      rerender({ query: '' });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.tracks).toEqual([]);
      });
    });
  });
});
