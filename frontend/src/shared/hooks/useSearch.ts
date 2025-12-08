import { useState, useEffect } from 'react';

import { searchService } from '../services/search.service';
import { useDebounce } from './useDebounce';
import { TrackWithPopulated } from '../types/track.types';

export interface UseSearchReturn {
  tracks: TrackWithPopulated[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook for searching tracks with debouncing
 * @param query - The search query string
 * @returns Object containing tracks, loading state, and error state
 */
export function useSearch(query: string): UseSearchReturn {
  const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setTracks([]);
      setError(null);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const results = await searchService.search(debouncedQuery);
        setTracks(results.tracks);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setTracks([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  return { tracks, isLoading, error };
}
