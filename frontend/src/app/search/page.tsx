'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Play, Music, User } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { TopBar } from '@/shared/components/layout/TopBar';
import { PlayerBar } from '@/shared/components/layout/PlayerBar';
import { QueuePanel } from '@/shared/components/layout/QueuePanel';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useAuth } from '@/shared/contexts/AuthContext';
import { usePlayer } from '@/shared/contexts/PlayerContext';
import { useToast } from '@/shared/hooks/useToast';
import { searchService } from '@/shared/services/search.service';
import { TrackWithPopulated } from '@/shared/types/track.types';
import { Artist } from '@/shared/types/artist.types';
import { AlbumWithPopulated } from '@/shared/types/album.types';
import { formatTime } from '@/shared/utils/formatters';

interface SearchResults {
  tracks: TrackWithPopulated[];
  artists: Artist[];
  albums: AlbumWithPopulated[];
}

function SearchPageContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { playTrack, state, togglePlayPause } = usePlayer();

  const urlQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(urlQuery);
  const debouncedQuery = useDebounce(query, 300);

  // Sync query with URL params
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const searchResults = await searchService.search(debouncedQuery);
        setResults(searchResults);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Search failed',
          description: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, toast]);

  const handleTrackPlay = (track: TrackWithPopulated) => {
    if (state.currentTrack?._id === track._id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-spotify-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-spotify-black">
      <Sidebar />
      <main className="ml-64 pb-24">
        <TopBar initialQuery={urlQuery} />
        <div className="p-8">
          {/* Search Results / Browse */}
          {isSearching ? (
            <div className="space-y-8">
              {/* Tracks skeleton */}
              <section>
                <Skeleton className="mb-4 h-6 w-24" />
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 rounded-md p-2"
                    >
                      <Skeleton className="h-12 w-12 rounded" />
                      <div className="flex-1">
                        <Skeleton className="mb-1 h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-4 w-10" />
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : debouncedQuery && results ? (
            <div className="space-y-8">
              {/* Tracks Section */}
              {results.tracks.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-bold text-white">Tracks</h2>
                  <div className="space-y-1">
                    {results.tracks.map((track) => {
                      const isCurrentTrack = state.currentTrack?._id === track._id;
                      const isPlaying = isCurrentTrack && state.isPlaying;

                      const artistName =
                        typeof track.artistId === 'object'
                          ? track.artistId.name
                          : 'Unknown Artist';

                      const albumCover =
                        typeof track.albumId === 'object'
                          ? track.albumId.coverImageUrl
                          : undefined;

                      return (
                        <div
                          key={track._id}
                          className={cn(
                            'group flex cursor-pointer items-center gap-4 rounded-md p-2 transition-colors hover:bg-spotify-light-gray',
                            isCurrentTrack && 'bg-spotify-light-gray/50',
                          )}
                          onClick={() => handleTrackPlay(track)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleTrackPlay(track);
                            }
                          }}
                        >
                          <div className="relative h-12 w-12 overflow-hidden rounded">
                            {albumCover ? (
                              <Image
                                src={albumCover}
                                alt={track.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-spotify-light-gray">
                                <Music className="h-5 w-5 text-spotify-text-subdued" />
                              </div>
                            )}
                            <Button
                              size="icon"
                              className="absolute inset-0 flex h-full w-full items-center justify-center rounded-none bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTrackPlay(track);
                              }}
                            >
                              {isPlaying ? (
                                <span className="flex items-center gap-0.5">
                                  <span className="h-3 w-1 animate-pulse bg-spotify-green" />
                                  <span className="h-4 w-1 animate-pulse bg-spotify-green" style={{ animationDelay: '0.2s' }} />
                                  <span className="h-2 w-1 animate-pulse bg-spotify-green" style={{ animationDelay: '0.4s' }} />
                                </span>
                              ) : (
                                <Play className="h-5 w-5 text-white" fill="white" />
                              )}
                            </Button>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'truncate text-sm font-medium',
                                isCurrentTrack ? 'text-spotify-green' : 'text-white',
                              )}
                            >
                              {track.title}
                            </p>
                            <p className="truncate text-xs text-spotify-text-subdued">
                              {artistName}
                            </p>
                          </div>
                          <span className="text-sm text-spotify-text-subdued">
                            {formatTime(track.durationInSeconds)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Albums Section */}
              {results.albums.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-bold text-white">Albums</h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {results.albums.map((album) => {
                      const artistName =
                        typeof album.artistId === 'object'
                          ? album.artistId.name
                          : 'Unknown Artist';

                      return (
                        <div
                          key={album._id}
                          className="rounded-md bg-spotify-dark-gray p-4 transition-colors hover:bg-spotify-light-gray"
                        >
                          <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-md shadow-lg">
                            {album.coverImageUrl ? (
                              <Image
                                src={album.coverImageUrl}
                                alt={album.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-spotify-light-gray">
                                <Music className="h-12 w-12 text-spotify-text-subdued" />
                              </div>
                            )}
                          </div>
                          <h3 className="truncate text-base font-semibold text-white">
                            {album.title}
                          </h3>
                          <p className="truncate text-sm text-spotify-text-subdued">
                            {artistName}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Artists Section */}
              {results.artists.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xl font-bold text-white">Artists</h2>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {results.artists.map((artist) => (
                      <div
                        key={artist._id}
                        className="rounded-md bg-spotify-dark-gray p-4 transition-colors hover:bg-spotify-light-gray"
                      >
                        <div className="relative mb-4 aspect-square w-full overflow-hidden rounded-full shadow-lg">
                          {artist.imageUrl ? (
                            <Image
                              src={artist.imageUrl}
                              alt={artist.name}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-spotify-light-gray">
                              <User className="h-12 w-12 text-spotify-text-subdued" />
                            </div>
                          )}
                        </div>
                        <h3 className="truncate text-center text-base font-semibold text-white">
                          {artist.name}
                        </h3>
                        <p className="truncate text-center text-sm text-spotify-text-subdued">
                          Artist
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* No results */}
              {results.tracks.length === 0 &&
                results.albums.length === 0 &&
                results.artists.length === 0 && (
                  <div className="py-12 text-center">
                    <p className="text-lg font-semibold text-white">
                      No results found for &quot;{debouncedQuery}&quot;
                    </p>
                    <p className="mt-2 text-spotify-text-subdued">
                      Try searching for something else
                    </p>
                  </div>
                )}
            </div>
          ) : (
            // Browse categories when no search
            <div>
              <h2 className="mb-4 text-xl font-bold text-white">Browse All</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {[
                  { name: 'Rock', searchTerm: 'rock', color: '#E13300', image: 'https://picsum.photos/seed/rock-genre/200/200' },
                  { name: 'Pop', searchTerm: 'pop', color: '#1DB954', image: 'https://picsum.photos/seed/pop-genre/200/200' },
                  { name: 'Jazz', searchTerm: 'jazz', color: '#8D67AB', image: 'https://picsum.photos/seed/jazz-genre/200/200' },
                  { name: 'Electronic', searchTerm: 'electronic', color: '#1E3264', image: 'https://picsum.photos/seed/electronic-genre/200/200' },
                  { name: 'Hip-Hop', searchTerm: 'hip-hop', color: '#E61E32', image: 'https://picsum.photos/seed/hiphop-genre/200/200' },
                ].map((genre) => (
                  <button
                    key={genre.name}
                    onClick={() => {
                      setQuery(genre.searchTerm);
                      router.push(`/search?q=${encodeURIComponent(genre.searchTerm)}`);
                    }}
                    className="group relative h-40 cursor-pointer overflow-hidden rounded-lg transition-transform hover:scale-105"
                    style={{ backgroundColor: genre.color }}
                  >
                    <span className="absolute left-4 top-4 z-10 text-2xl font-bold text-white drop-shadow-lg">
                      {genre.name}
                    </span>
                    <Image
                      src={genre.image}
                      alt={genre.name}
                      width={100}
                      height={100}
                      className="absolute -bottom-2 -right-4 rotate-[25deg] rounded-md shadow-xl transition-transform group-hover:rotate-[30deg]"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <PlayerBar />
      <QueuePanel />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-spotify-black">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
