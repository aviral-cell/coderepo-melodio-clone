import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Music, Clock, Play } from 'lucide-react';
import { useSearch } from '../../hooks/useSearch';
import { useMusicPlayer } from '../../stores/musicPlayerStore';
import { useSongs } from '../../hooks/useSongs';
import { formatDuration } from '../../utils/formatDuration';
import styles from './Search.module.css';
import type { Song } from '../../types';

interface SearchProps {
  placeholder?: string;
  className?: string;
  onSongSelect?: (song: Song) => void;
}

const Search: React.FC<SearchProps> = ({ 
  placeholder = "What do you want to play?", 
  className,
  onSongSelect
}) => {
  const [query, setQuery] = useState('');
  const [isResultsVisible, setIsResultsVisible] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const {
    searchResults,
    isLoading,
    error,
    hasSearched,
    search,
    clearSearch,
    canLoadMore,
    loadMore
  } = useSearch();

  const { playSong } = useMusicPlayer();
  const { songsInPlaylist } = useSongs();

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        search(query.trim());
        setIsResultsVisible(true);
      } else {
        clearSearch();
        setIsResultsVisible(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, search, clearSearch]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsResultsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      search(query.trim());
      setIsResultsVisible(true);
    }
  };

  const handleSongClick = (song: Song) => {
    // Create queue: selected song first, then liked songs
    const playlistSongs = songsInPlaylist.map(song => song.song);
    const queue = [song, ...playlistSongs];
    
    // Play the selected song and set the queue
    playSong(song, queue);
    
    // Call the optional onSongSelect callback if provided
    if (onSongSelect) {
      onSongSelect(song);
    }
    
    // Hide the search results
    setIsResultsVisible(false);
  };

  const handleLoadMore = () => {
    if (canLoadMore()) {
      loadMore();
    }
  };

  return (
    <div ref={searchRef} className={`${styles.searchWrapper} ${className || ''}`}>
      <form onSubmit={handleSubmit} className={styles.searchContainer}>
        <SearchIcon className={styles.searchIcon} size={16} />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsResultsVisible(hasSearched)}
          className={styles.searchInput}
        />
      </form>

      {isResultsVisible && (
        <div className={styles.resultsContainer}>
          {isLoading && !hasSearched && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <span>Searching...</span>
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              <span>Error: {error.message}</span>
            </div>
          )}

          {hasSearched && searchResults.length === 0 && !isLoading && (
            <div className={styles.emptyState}>
              <Music size={24} />
              <span>No songs found</span>
              <p>Try searching for something else</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <>
              <div className={styles.resultsHeader}>
                <span className={styles.resultsCount}>
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className={styles.resultsList}>
                {searchResults.map((song) => (
                  <div
                    key={song.id}
                    className={styles.resultItem}
                    onClick={() => handleSongClick(song)}
                  >
                    <div className={styles.songImage}>
                      {song.imageUrl ? (
                        <img src={song.imageUrl} alt={song.title} />
                      ) : (
                        <div className={styles.placeholderImage}>
                          <Music size={20} />
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.songInfo}>
                      <div className={styles.songTitle}>{song.title}</div>
                      <div className={styles.songArtist}>{song.artist}</div>
                      {song.album && (
                        <div className={styles.songAlbum}>{song.album}</div>
                      )}
                    </div>
                    
                    <div className={styles.songDuration}>
                      <Clock size={12} />
                      <span>{formatDuration(song.duration)}</span>
                    </div>
                    
                    <div className={styles.playButton}>
                      <Play size={16} />
                    </div>
                  </div>
                ))}
              </div>

              {canLoadMore() && (
                <div className={styles.loadMoreContainer}>
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className={styles.loadMoreButton}
                  >
                    {isLoading ? (
                      <>
                        <div className={styles.spinner} />
                        Loading more...
                      </>
                    ) : (
                      'Load more results'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
