'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, LogOut, User } from 'lucide-react';

import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { SearchDropdown } from '@/shared/components/common/SearchDropdown';
import { useAuth } from '@/shared/contexts/AuthContext';
import { usePlayer } from '@/shared/contexts/PlayerContext';
import { TrackWithPopulated } from '@/shared/types/track.types';

interface TopBarProps {
  initialQuery?: string;
}

export function TopBar({ initialQuery = '' }: TopBarProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { playTrack } = usePlayer();
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Open dropdown when query has content
  useEffect(() => {
    setIsDropdownOpen(searchQuery.trim().length > 0);
  }, [searchQuery]);

  // Click outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Escape key handler
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Do not navigate anywhere - just prevent default
  }, []);

  const handleTrackSelect = useCallback(
    (track: TrackWithPopulated) => {
      playTrack(track);
      setIsDropdownOpen(false);
    },
    [playTrack],
  );

  const handleCloseDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  const userInitial = user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-spotify-black/95 px-3 md:px-6 backdrop-blur-sm">
      {/* Left spacer - hidden on mobile */}
      <div className="hidden md:block md:w-32" />

      {/* Center: Search Bar */}
      <form onSubmit={handleSearch} className="flex-1 max-w-xl">
        <div ref={searchContainerRef} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-spotify-text-subdued" />
          <Input
            type="text"
            placeholder="What do you want to play?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-full border-0 bg-spotify-dark-gray py-2 pl-10 pr-4 text-sm text-white placeholder:text-spotify-text-subdued focus:ring-2 focus:ring-white"
          />
          <SearchDropdown
            query={searchQuery}
            isOpen={isDropdownOpen}
            onClose={handleCloseDropdown}
            onTrackSelect={handleTrackSelect}
          />
        </div>
      </form>

      {/* Right: User Profile - flexible on mobile */}
      <div className="flex w-auto md:w-32 items-center justify-end ml-2 md:ml-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 rounded-full bg-spotify-dark-gray px-2 py-1 hover:bg-spotify-light-gray"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-spotify-green text-sm font-bold text-black">
                {userInitial}
              </div>
              <span className="hidden text-sm text-white sm:inline">
                {user?.displayName?.split(' ')[0] || 'User'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-spotify-light-gray bg-spotify-dark-gray"
          >
            <DropdownMenuLabel className="text-white">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{user?.displayName || 'User'}</span>
              </div>
              <p className="mt-1 text-xs font-normal text-spotify-text-subdued">
                {user?.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-spotify-light-gray" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-spotify-text-subdued hover:bg-spotify-light-gray hover:text-white focus:bg-spotify-light-gray focus:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
