import { useState, useEffect, useCallback } from 'react';
import { TrackWithPopulated } from '../types/track.types';

const STORAGE_KEY = 'spotify_clone_recently_played';
const MAX_RECENT_TRACKS = 10;

export function useRecentlyPlayed() {
  const [recentTracks, setRecentTracks] = useState<TrackWithPopulated[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentTracks(JSON.parse(stored));
      }
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, []);

  const addToRecentlyPlayed = useCallback((track: TrackWithPopulated) => {
    setRecentTracks((prev) => {
      // Remove track if it already exists
      const filtered = prev.filter((t) => t._id !== track._id);
      // Add to beginning
      const updated = [track, ...filtered].slice(0, MAX_RECENT_TRACKS);

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Silently fail
      }

      return updated;
    });
  }, []);

  return { recentTracks, addToRecentlyPlayed };
}
