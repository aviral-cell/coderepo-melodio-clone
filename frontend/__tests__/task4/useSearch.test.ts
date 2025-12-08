import { renderHook, waitFor, act } from '@testing-library/react';
import { useSearch } from '@/shared/hooks/useSearch';
import { searchService } from '@/shared/services/search.service';
import { useDebounce } from '@/shared/hooks/useDebounce';

// Mock the search service
jest.mock('@/shared/services/search.service', () => ({
  searchService: {
    search: jest.fn(),
  },
}));

// Mock useDebounce to return the value immediately for testing
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

describe('useSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDebounce.mockImplementation((value: string) => value);
  });

  describe('empty query handling', () => {
    it('should return empty tracks array when query is empty', () => {
      const { result } = renderHook(() => useSearch(''));

      expect(result.current.tracks).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should not call search service when query is empty', () => {
      renderHook(() => useSearch(''));

      expect(mockSearchService.search).not.toHaveBeenCalled();
    });

    it('should not call search service when query is only whitespace', () => {
      renderHook(() => useSearch('   '));

      expect(mockSearchService.search).not.toHaveBeenCalled();
    });
  });

  describe('debouncing', () => {
    it('should use useDebounce hook with 300ms delay', () => {
      renderHook(() => useSearch('test query'));

      expect(mockUseDebounce).toHaveBeenCalledWith('test query', 300);
    });

    it('should use debounced value for search', async () => {
      mockUseDebounce.mockImplementation(() => 'debounced');
      mockSearchService.search.mockResolvedValue({ tracks: [mockTrack] });

      renderHook(() => useSearch('original'));

      await waitFor(() => {
        expect(mockSearchService.search).toHaveBeenCalledWith('debounced');
      });
    });
  });

  describe('search execution', () => {
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

    it('should return tracks from search service', async () => {
      mockSearchService.search.mockResolvedValue({ tracks: [mockTrack] });

      const { result } = renderHook(() => useSearch('test'));

      await waitFor(() => {
        expect(result.current.tracks).toEqual([mockTrack]);
      });
    });

    it('should call search service with the query', async () => {
      mockSearchService.search.mockResolvedValue({ tracks: [] });

      renderHook(() => useSearch('my search query'));

      await waitFor(() => {
        expect(mockSearchService.search).toHaveBeenCalledWith('my search query');
      });
    });
  });

  describe('error handling', () => {
    it('should set error when search fails', async () => {
      mockSearchService.search.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSearch('test'));

      await waitFor(() => {
        expect(result.current.error).toBe('Network error');
        expect(result.current.tracks).toEqual([]);
      });
    });

    it('should set generic error message for non-Error exceptions', async () => {
      mockSearchService.search.mockRejectedValue('Something went wrong');

      const { result } = renderHook(() => useSearch('test'));

      await waitFor(() => {
        expect(result.current.error).toBe('Search failed');
      });
    });

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
