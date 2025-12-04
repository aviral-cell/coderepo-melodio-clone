'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Pause, Music, Clock3, Plus, MoreHorizontal, ListPlus } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { TopBar } from '@/shared/components/layout/TopBar';
import { PlayerBar } from '@/shared/components/layout/PlayerBar';
import { QueuePanel } from '@/shared/components/layout/QueuePanel';
import { EmptyState } from '@/shared/components/common/EmptyState';
import { AddToPlaylistModal } from '@/shared/components/common/AddToPlaylistModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useAuth } from '@/shared/contexts/AuthContext';
import { usePlayer } from '@/shared/contexts/PlayerContext';
import { useToast } from '@/shared/hooks/useToast';
import { tracksService } from '@/shared/services/tracks.service';
import { TrackWithPopulated } from '@/shared/types/track.types';
import { formatTime } from '@/shared/utils/formatters';

export default function TrackPage() {
  const params = useParams();
  const router = useRouter();
  const trackId = params.id as string;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { state, playTrack, togglePlayPause, addToQueue } = usePlayer();
  const { toast } = useToast();

  const [track, setTrack] = useState<TrackWithPopulated | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchTrack = useCallback(async () => {
    try {
      const data = await tracksService.getById(trackId);
      setTrack(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load track',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  }, [trackId, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTrack();
    }
  }, [isAuthenticated, fetchTrack]);

  const handlePlay = () => {
    if (!track) return;
    if (state.currentTrack?._id === track._id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const handleAddToQueue = () => {
    if (!track) return;
    addToQueue(track);
    toast({
      title: 'Added to queue',
      description: `"${track.title}" added to queue`,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-spotify-black">
        <Sidebar />
        <main className="ml-64 pb-24">
          <TopBar />
          <div className="bg-gradient-to-b from-teal-800 to-spotify-dark-gray p-8">
            <div className="flex items-end gap-6">
              <Skeleton className="h-56 w-56 rounded" />
              <div className="flex-1">
                <Skeleton className="mb-2 h-4 w-16" />
                <Skeleton className="mb-6 h-16 w-64" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        </main>
        <PlayerBar />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-spotify-black">
        <Sidebar />
        <main className="ml-64 flex items-center justify-center pb-24">
          <TopBar />
          <EmptyState
            title="Track not found"
            description="This track doesn't exist or has been removed"
          />
        </main>
        <PlayerBar />
      </div>
    );
  }

  const artistName =
    typeof track.artistId === 'object' ? track.artistId.name : 'Unknown Artist';
  const artistId =
    typeof track.artistId === 'object' ? track.artistId._id : null;

  const albumTitle =
    typeof track.albumId === 'object' ? track.albumId.title : 'Unknown Album';
  const albumId =
    typeof track.albumId === 'object' ? track.albumId._id : null;
  const albumCover =
    typeof track.albumId === 'object' ? track.albumId.coverImageUrl : undefined;

  const isCurrentTrack = state.currentTrack?._id === track._id;
  const isPlaying = isCurrentTrack && state.isPlaying;

  return (
    <div className="min-h-screen bg-spotify-black">
      <Sidebar />
      <main className="ml-64 pb-24">
        <TopBar />
        {/* Track Header */}
        <div className="bg-gradient-to-b from-teal-800 to-spotify-dark-gray p-8">
          <div className="flex items-end gap-6">
            <div className="relative h-56 w-56 overflow-hidden rounded shadow-2xl">
              {albumCover ? (
                <Image
                  src={albumCover}
                  alt={track.title}
                  fill
                  className="object-cover"
                  sizes="224px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-spotify-light-gray">
                  <Music className="h-20 w-20 text-spotify-text-subdued" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Song</p>
              <h1 className="mb-4 text-5xl font-bold text-white">{track.title}</h1>
              <div className="flex items-center gap-2 text-sm">
                {artistId ? (
                  <Link
                    href={`/artist/${artistId}`}
                    className="font-semibold text-white hover:underline"
                  >
                    {artistName}
                  </Link>
                ) : (
                  <span className="font-semibold text-white">{artistName}</span>
                )}
                <span className="text-spotify-text-subdued">-</span>
                {albumId ? (
                  <Link
                    href={`/album/${albumId}`}
                    className="text-spotify-text-subdued hover:text-white hover:underline"
                  >
                    {albumTitle}
                  </Link>
                ) : (
                  <span className="text-spotify-text-subdued">{albumTitle}</span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-spotify-text-subdued">
                <span className="capitalize">{track.genre}</span>
                <span className="flex items-center gap-1">
                  <Clock3 className="h-4 w-4" />
                  {formatTime(track.durationInSeconds)}
                </span>
                <span>{track.playCount.toLocaleString()} plays</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-b from-spotify-dark-gray/60 to-spotify-black px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              className="h-14 w-14 rounded-full bg-spotify-green hover:scale-105 hover:bg-spotify-green-dark"
              onClick={handlePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-6 w-6 text-black" fill="black" />
              ) : (
                <Play className="h-6 w-6 text-black" fill="black" />
              )}
            </Button>

            {/* Add to Playlist Button */}
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 rounded-full text-spotify-text-subdued hover:text-white hover:scale-105"
              onClick={() => setIsPlaylistModalOpen(true)}
              aria-label="Add to playlist"
            >
              <Plus className="h-6 w-6" />
            </Button>

            {/* More Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-10 w-10 rounded-full text-spotify-text-subdued hover:text-white hover:scale-105"
                  aria-label="More options"
                >
                  <MoreHorizontal className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-48 border-spotify-light-gray bg-spotify-dark-gray"
              >
                <DropdownMenuItem
                  onClick={handleAddToQueue}
                  className="cursor-pointer text-white hover:bg-spotify-light-gray focus:bg-spotify-light-gray focus:text-white"
                >
                  <ListPlus className="mr-2 h-4 w-4" />
                  Add to queue
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsPlaylistModalOpen(true)}
                  className="cursor-pointer text-white hover:bg-spotify-light-gray focus:bg-spotify-light-gray focus:text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Additional Info */}
        <div className="px-8 py-4">
          <div className="rounded-lg bg-spotify-dark-gray p-6">
            <h2 className="mb-4 text-lg font-bold text-white">About this track</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <dt className="text-spotify-text-subdued">Artist</dt>
                <dd className="mt-1 font-medium text-white">{artistName}</dd>
              </div>
              <div>
                <dt className="text-spotify-text-subdued">Album</dt>
                <dd className="mt-1 font-medium text-white">{albumTitle}</dd>
              </div>
              <div>
                <dt className="text-spotify-text-subdued">Genre</dt>
                <dd className="mt-1 font-medium capitalize text-white">{track.genre}</dd>
              </div>
              <div>
                <dt className="text-spotify-text-subdued">Track #</dt>
                <dd className="mt-1 font-medium text-white">{track.trackNumber}</dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
      <PlayerBar />
      <QueuePanel />

      {/* Add to Playlist Modal */}
      <AddToPlaylistModal
        isOpen={isPlaylistModalOpen}
        onClose={() => setIsPlaylistModalOpen(false)}
        trackId={track._id}
        trackTitle={track.title}
      />
    </div>
  );
}
