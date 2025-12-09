'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/hooks/useToast';
import { LoadingSpinner } from '@/shared/components/common/LoadingSpinner';
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { TrackCard } from '@/shared/components/common/TrackCard';
import { PlaylistCard } from '@/shared/components/common/PlaylistCard';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { tracksService } from '@/shared/services/tracks.service';
import { playlistsService } from '@/shared/services/playlists.service';
import { albumsService } from '@/shared/services/albums.service';
import { useRecentlyPlayed } from '@/shared/hooks/useRecentlyPlayed';
import { TrackWithPopulated } from '@/shared/types/track.types';
import { Playlist } from '@/shared/types/playlist.types';
import { AlbumWithPopulated } from '@/shared/types/album.types';
import { AlbumCard } from '@/shared/components/common/AlbumCard';

export default function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { recentTracks } = useRecentlyPlayed();

  const [recommendedTracks, setRecommendedTracks] = useState<TrackWithPopulated[]>([]);
  const [tracks, setTracks] = useState<TrackWithPopulated[]>([]);
  const [albums, setAlbums] = useState<AlbumWithPopulated[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState(true);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchTracks = async () => {
      try {
        const response = await tracksService.getAll({ page: 1, limit: 30 });
        const allTracks = response.items;
        setTracks(allTracks.slice(0, 20));
        // Shuffle for recommended - simple Fisher-Yates shuffle
        const shuffled = [...allTracks].sort(() => Math.random() - 0.5);
        setRecommendedTracks(shuffled.slice(0, 10));
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load tracks',
          description: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setIsLoadingTracks(false);
      }
    };

    const fetchAlbums = async () => {
      try {
        const response = await albumsService.getAll({ page: 1, limit: 10 });
        setAlbums(response.items);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load albums',
          description: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setIsLoadingAlbums(false);
      }
    };

    const fetchPlaylists = async () => {
      try {
        const response = await playlistsService.getAll();
        setPlaylists(response);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load playlists',
          description: error instanceof Error ? error.message : 'Please try again',
        });
      } finally {
        setIsLoadingPlaylists(false);
      }
    };

    fetchTracks();
    fetchAlbums();
    fetchPlaylists();
  }, [isAuthenticated, toast]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-hackify-black">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="mb-6 text-3xl font-bold text-white">{getGreeting()}</h1>

          {/* Recommended for you Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">Recommended for you</h2>
            {isLoadingTracks ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="rounded-md bg-hackify-dark-gray p-4">
                    <Skeleton className="mb-4 aspect-square w-full rounded-md" />
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : recommendedTracks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {recommendedTracks.map((track) => (
                  <TrackCard key={track._id} track={track} />
                ))}
              </div>
            ) : (
              <p className="text-hackify-text-subdued">
                No recommendations available yet.
              </p>
            )}
          </section>

          {/* Recently Played Section */}
          {recentTracks.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-white">Recently played</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {recentTracks.slice(0, 5).map((track) => (
                  <TrackCard key={track._id} track={track} />
                ))}
              </div>
            </section>
          )}

          {/* Browse Albums Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">Browse Albums</h2>
            {isLoadingAlbums ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="rounded-md bg-hackify-dark-gray p-4">
                    <Skeleton className="mb-4 aspect-square w-full rounded-md" />
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : albums.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {albums.map((album) => (
                  <AlbumCard key={album._id} album={album} />
                ))}
              </div>
            ) : (
              <p className="text-hackify-text-subdued">
                No albums available. Check back later!
              </p>
            )}
          </section>

          {/* Browse Tracks Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">Browse Tracks</h2>
            {isLoadingTracks ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {Array.from({ length: 10 }).map((_, index) => (
                  <div key={index} className="rounded-md bg-hackify-dark-gray p-4">
                    <Skeleton className="mb-4 aspect-square w-full rounded-md" />
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : tracks.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {tracks.map((track) => (
                  <TrackCard key={track._id} track={track} />
                ))}
              </div>
            ) : (
              <p className="text-hackify-text-subdued">
                No tracks available. Check back later!
              </p>
            )}
          </section>

          {/* Your Playlists Section */}
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-white">Your Playlists</h2>
            {isLoadingPlaylists ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="rounded-md bg-hackify-dark-gray p-4">
                    <Skeleton className="mb-4 aspect-square w-full rounded-md" />
                    <Skeleton className="mb-2 h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : playlists.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {playlists.map((playlist) => (
                  <PlaylistCard key={playlist._id} playlist={playlist} />
                ))}
              </div>
            ) : (
              <p className="text-hackify-text-subdued">
                You don&apos;t have any playlists yet. Create one to get started!
              </p>
            )}
          </section>
        </div>
    </MainLayout>
  );
}
