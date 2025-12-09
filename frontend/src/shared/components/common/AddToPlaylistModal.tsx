'use client';

import { useState, useEffect } from 'react';
import { Plus, Music, X } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { playlistsService } from '@/shared/services/playlists.service';
import { Playlist } from '@/shared/types/playlist.types';
import { useToast } from '@/shared/hooks/useToast';

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackId: string;
  trackTitle: string;
}

export function AddToPlaylistModal({
  isOpen,
  onClose,
  trackId,
  trackTitle,
}: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const data = await playlistsService.getAll();
      setPlaylists(data);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load playlists',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
    try {
      await playlistsService.addTrack(playlistId, trackId);
      toast({
        title: 'Added to playlist',
        description: `"${trackTitle}" added to "${playlistName}"`,
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to add track',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const newPlaylist = await playlistsService.create({ name: newPlaylistName.trim() });
      await playlistsService.addTrack(newPlaylist._id, trackId);
      toast({
        title: 'Playlist created',
        description: `"${trackTitle}" added to "${newPlaylistName}"`,
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to create playlist',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsCreating(false);
      setNewPlaylistName('');
      setShowNewPlaylistInput(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg bg-hackify-dark-gray p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Add to playlist</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-hackify-text-subdued hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* New Playlist */}
        {showNewPlaylistInput ? (
          <div className="mb-4 flex gap-2">
            <Input
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              className="bg-hackify-light-gray"
              autoFocus
            />
            <Button
              onClick={handleCreatePlaylist}
              disabled={!newPlaylistName.trim() || isCreating}
              className="bg-hackify-green hover:bg-hackify-green-dark"
            >
              {isCreating ? '...' : 'Create'}
            </Button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewPlaylistInput(true)}
            className="mb-4 flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-hackify-light-gray"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded bg-hackify-light-gray">
              <Plus className="h-6 w-6 text-hackify-text-subdued" />
            </div>
            <span className="font-medium text-white">New playlist</span>
          </button>
        )}

        {/* Playlist List */}
        <div className="max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="py-8 text-center text-hackify-text-subdued">
              Loading playlists...
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-8 text-center text-hackify-text-subdued">
              No playlists yet. Create one above!
            </div>
          ) : (
            <div className="space-y-1">
              {playlists.map((playlist) => (
                <button
                  key={playlist._id}
                  onClick={() => handleAddToPlaylist(playlist._id, playlist.name)}
                  className="flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors hover:bg-hackify-light-gray"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-hackify-light-gray">
                    <Music className="h-5 w-5 text-hackify-text-subdued" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{playlist.name}</p>
                    <p className="text-sm text-hackify-text-subdued">
                      {playlist.trackIds?.length || 0} tracks
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
