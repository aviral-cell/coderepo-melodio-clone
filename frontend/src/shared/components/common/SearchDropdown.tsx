'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Music, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { searchService } from '@/shared/services/search.service';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { formatTime } from '@/shared/utils/formatters';
import { TrackWithPopulated } from '@/shared/types/track.types';

interface SearchDropdownProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
  onTrackSelect: (track: TrackWithPopulated) => void;
}

export function SearchDropdown({
  query,
  isOpen,
  onClose,
  onTrackSelect,
}: SearchDropdownProps) {
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

  const handleTrackClick = (track: TrackWithPopulated) => {
    onTrackSelect(track);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-lg bg-spotify-dark-gray shadow-xl">
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-spotify-text-subdued" />
        </div>
      ) : error ? (
        <div className="px-4 py-8 text-center text-sm text-spotify-text-subdued">
          {error}
        </div>
      ) : tracks.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-spotify-text-subdued">
          No results found
        </div>
      ) : (
        <>
          <div className="border-b border-spotify-light-gray px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-spotify-text-subdued">
              {tracks.length} {tracks.length === 1 ? 'RESULT' : 'RESULTS'}
            </span>
          </div>
          <div className="py-2">
            {tracks.map((track) => {
              const artistName =
                typeof track.artistId === 'object'
                  ? track.artistId.name
                  : 'Unknown Artist';
              const albumTitle =
                typeof track.albumId === 'object'
                  ? track.albumId.title
                  : 'Unknown Album';
              const albumCover =
                typeof track.albumId === 'object'
                  ? track.albumId.coverImageUrl
                  : undefined;

              return (
                <button
                  key={track._id}
                  type="button"
                  onClick={() => handleTrackClick(track)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-left transition-colors',
                    'hover:bg-spotify-light-gray focus:bg-spotify-light-gray focus:outline-none',
                  )}
                >
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded">
                    {albumCover ? (
                      <Image
                        src={albumCover}
                        alt={track.title}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-spotify-light-gray">
                        <Music className="h-4 w-4 text-spotify-text-subdued" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {track.title}
                    </p>
                    <p className="truncate text-xs text-spotify-text-subdued">
                      {artistName} - {albumTitle}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-sm text-spotify-text-subdued">
                    {formatTime(track.durationInSeconds)}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
