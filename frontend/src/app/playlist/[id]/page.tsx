'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Play,
  Pause,
  Clock3,
  MoreHorizontal,
  Trash2,
  Edit2,
  Music,
  GripVertical,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { MainLayout } from '@/shared/components/layout/MainLayout';
import { EmptyState } from '@/shared/components/common/EmptyState';
import { useAuth } from '@/shared/contexts/AuthContext';
import { usePlayer } from '@/shared/contexts/PlayerContext';
import { useToast } from '@/shared/hooks/useToast';
import { usePlaylistOperations } from '@/shared/hooks/usePlaylistOperations';
import { playlistsService } from '@/shared/services/playlists.service';
import { PlaylistWithTracks } from '@/shared/types/playlist.types';
import { TrackWithPopulated } from '@/shared/types/track.types';
import { formatTime, formatDuration } from '@/shared/utils/formatters';

// Sortable track row component
interface SortableTrackRowProps {
  track: TrackWithPopulated;
  index: number;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

function SortableTrackRow({
  track,
  index,
  isCurrentTrack,
  isPlaying,
  onPlay,
  onRemove,
}: SortableTrackRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const artistName =
    typeof track.artistId === 'object' ? track.artistId.name : 'Unknown Artist';

  const albumTitle =
    typeof track.albumId === 'object' ? track.albumId.title : 'Unknown Album';

  const albumCover =
    typeof track.albumId === 'object' ? track.albumId.coverImageUrl : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group grid grid-cols-[16px_16px_4fr_3fr_1fr_40px] items-center gap-4 rounded-md px-4 py-2 transition-colors hover:bg-spotify-light-gray',
        isCurrentTrack && 'bg-spotify-light-gray/50',
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-spotify-text-subdued opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Track Number / Play Button */}
      <div className="flex items-center justify-center">
        <span
          className={cn(
            'text-sm group-hover:hidden',
            isCurrentTrack ? 'text-spotify-green' : 'text-spotify-text-subdued',
          )}
        >
          {isCurrentTrack && isPlaying ? (
            <span className="flex items-center gap-0.5">
              <span className="h-2 w-0.5 animate-pulse bg-spotify-green" />
              <span className="h-3 w-0.5 animate-pulse bg-spotify-green" style={{ animationDelay: '0.2s' }} />
              <span className="h-1.5 w-0.5 animate-pulse bg-spotify-green" style={{ animationDelay: '0.4s' }} />
            </span>
          ) : (
            index + 1
          )}
        </span>
        <button
          onClick={onPlay}
          className="hidden group-hover:block"
          aria-label={isPlaying && isCurrentTrack ? 'Pause' : 'Play'}
        >
          {isPlaying && isCurrentTrack ? (
            <Pause className="h-4 w-4 text-white" fill="white" />
          ) : (
            <Play className="h-4 w-4 text-white" fill="white" />
          )}
        </button>
      </div>

      {/* Title and Artist */}
      <div className="flex min-w-0 items-center gap-3">
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
        <div className="min-w-0">
          <p
            className={cn(
              'truncate text-sm font-medium',
              isCurrentTrack ? 'text-spotify-green' : 'text-white',
            )}
          >
            {track.title}
          </p>
          <p className="truncate text-xs text-spotify-text-subdued">{artistName}</p>
        </div>
      </div>

      {/* Album */}
      <span className="truncate text-sm text-spotify-text-subdued">{albumTitle}</span>

      {/* Duration */}
      <span className="text-sm text-spotify-text-subdued">
        {formatTime(track.durationInSeconds)}
      </span>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreHorizontal className="h-4 w-4 text-spotify-text-subdued" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onRemove} className="text-red-400">
            <Trash2 className="mr-2 h-4 w-4" />
            Remove from playlist
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { state, playTracks, togglePlayPause } = usePlayer();
  const { toast } = useToast();

  const [playlist, setPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { reorderTracks, removeTrack } = usePlaylistOperations({
    playlistId,
    playlist,
    setPlaylist,
    onError: (message) => toast({ variant: 'destructive', title: 'Error', description: message }),
    onSuccess: (message) => toast({ title: 'Success', description: message }),
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  const fetchPlaylist = useCallback(async () => {
    try {
      const data = await playlistsService.getById(playlistId);
      setPlaylist(data);
      setEditName(data.name);
      setEditDescription(data.description || '');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load playlist',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  }, [playlistId, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylist();
    }
  }, [isAuthenticated, fetchPlaylist]);

  const handlePlayAll = () => {
    if (!playlist || playlist.trackIds.length === 0) return;
    playTracks(playlist.trackIds, 0);
  };

  const handleTrackPlay = (track: TrackWithPopulated, index: number) => {
    if (!playlist) return;

    if (state.currentTrack?._id === track._id) {
      togglePlayPause();
    } else {
      // Play this track and add rest of playlist to queue
      playTracks(playlist.trackIds, index);
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    removeTrack(trackId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !playlist || active.id === over.id) return;

    const oldIndex = playlist.trackIds.findIndex((t) => t._id === active.id);
    const newIndex = playlist.trackIds.findIndex((t) => t._id === over.id);

    reorderTracks(oldIndex, newIndex);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editName.trim()) {
      toast({
        variant: 'destructive',
        title: 'Name required',
        description: 'Please enter a playlist name',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await playlistsService.update(playlistId, {
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });

      setPlaylist((prev) => {
        if (!prev) return prev;
        return { ...prev, name: updated.name, description: updated.description };
      });

      toast({
        title: 'Playlist updated',
        description: 'Your changes have been saved',
      });

      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to update playlist',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);

    try {
      await playlistsService.delete(playlistId);
      toast({
        title: 'Playlist deleted',
        description: 'The playlist has been deleted',
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete playlist',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <MainLayout showTopBar={false}>
        {/* Header skeleton */}
        <div className="bg-gradient-to-b from-purple-800 to-spotify-dark-gray p-8">
          <div className="flex items-end gap-6">
            <Skeleton className="h-56 w-56 rounded" />
            <div className="flex-1">
              <Skeleton className="mb-2 h-4 w-20" />
              <Skeleton className="mb-6 h-16 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        {/* Controls skeleton */}
        <div className="bg-gradient-to-b from-spotify-dark-gray/60 to-spotify-black px-8 py-6">
          <Skeleton className="h-14 w-14 rounded-full" />
        </div>
        {/* Tracks skeleton */}
        <div className="px-8">
          <div className="mb-4 grid grid-cols-[16px_16px_4fr_3fr_1fr_40px] gap-4 border-b border-spotify-light-gray px-4 pb-2">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[16px_16px_4fr_3fr_1fr_40px] gap-4 px-4 py-2"
            >
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-4" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded" />
                <div>
                  <Skeleton className="mb-1 h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-4" />
            </div>
          ))}
        </div>
      </MainLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (!playlist) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center p-8">
          <EmptyState
            title="Playlist not found"
            description="This playlist doesn't exist or you don't have access to it"
          />
        </div>
      </MainLayout>
    );
  }

  const totalDuration = playlist.trackIds.reduce(
    (sum, track) => sum + track.durationInSeconds,
    0,
  );

  const isPlaylistPlaying =
    state.isPlaying &&
    playlist.trackIds.some((t) => t._id === state.currentTrack?._id);

  return (
    <MainLayout>
      {/* Playlist Header */}
      <div className="bg-gradient-to-b from-purple-800 to-spotify-dark-gray p-8">
          <div className="flex items-end gap-6">
            <div className="relative h-56 w-56 overflow-hidden rounded shadow-2xl">
              {playlist.coverImageUrl ? (
                <Image
                  src={playlist.coverImageUrl}
                  alt={playlist.name}
                  fill
                  className="object-cover"
                  sizes="224px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-700 to-blue-500">
                  <Music className="h-20 w-20 text-white" />
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">Playlist</p>
              <h1 className="mb-6 text-6xl font-bold text-white">{playlist.name}</h1>
              {playlist.description && (
                <p className="mb-2 text-sm text-spotify-text-subdued">
                  {playlist.description}
                </p>
              )}
              <p className="text-sm text-spotify-text-subdued">
                {playlist.trackIds.length}{' '}
                {playlist.trackIds.length === 1 ? 'track' : 'tracks'}
                {totalDuration > 0 && ` - ${formatDuration(totalDuration)}`}
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-gradient-to-b from-spotify-dark-gray/60 to-spotify-black px-8 py-6">
          <div className="flex items-center gap-6">
            <Button
              size="lg"
              className="h-14 w-14 rounded-full bg-spotify-green hover:scale-105 hover:bg-spotify-green-dark"
              onClick={handlePlayAll}
              disabled={playlist.trackIds.length === 0}
              aria-label={isPlaylistPlaying ? 'Pause' : 'Play all'}
            >
              {isPlaylistPlaying ? (
                <Pause className="h-6 w-6 text-black" fill="black" />
              ) : (
                <Play className="h-6 w-6 text-black" fill="black" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-spotify-text-subdued hover:text-white"
                >
                  <MoreHorizontal className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-400"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Track List */}
        <div className="px-8">
          {playlist.trackIds.length > 0 ? (
            <>
              {/* Header */}
              <div className="mb-4 grid grid-cols-[16px_16px_4fr_3fr_1fr_40px] gap-4 border-b border-spotify-light-gray px-4 pb-2 text-spotify-text-subdued">
                <span />
                <span className="text-sm">#</span>
                <span className="text-sm">Title</span>
                <span className="text-sm">Album</span>
                <span className="flex justify-end">
                  <Clock3 className="h-4 w-4" />
                </span>
                <span />
              </div>

              {/* Tracks */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={playlist.trackIds.map((t) => t._id)}
                  strategy={verticalListSortingStrategy}
                >
                  {playlist.trackIds.map((track, index) => (
                    <SortableTrackRow
                      key={track._id}
                      track={track}
                      index={index}
                      isCurrentTrack={state.currentTrack?._id === track._id}
                      isPlaying={state.isPlaying}
                      onPlay={() => handleTrackPlay(track, index)}
                      onRemove={() => handleRemoveTrack(track._id)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <EmptyState
              title="No tracks yet"
              description="Add tracks to this playlist to see them here"
            />
          )}
        </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border-spotify-light-gray bg-spotify-dark-gray sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Playlist</DialogTitle>
            <DialogDescription>
              Update your playlist details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium text-white">
                  Name
                </label>
                <Input
                  id="edit-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="bg-spotify-light-gray"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium text-white">
                  Description (optional)
                </label>
                <Input
                  id="edit-description"
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="bg-spotify-light-gray"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !editName.trim()}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="border-spotify-light-gray bg-spotify-dark-gray sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{playlist.name}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
