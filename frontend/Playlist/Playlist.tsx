import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Clock, ArrowLeft } from 'lucide-react';
import styles from './Playlist.module.css';
import { useSongs } from '../../hooks';
import { useMusicPlayer } from '../../stores/musicPlayerStore';
import { useUserContext } from '../../providers/UserProvider';
import { formatDuration, formatDate } from '../../utils';
import HeartButton from '../../components/HeartButton/HeartButton';
import type { Song } from '../../types';

const Playlist: React.FC = () => {
  const { playlistName } = useParams<{ playlistName?: string }>();
  const navigate = useNavigate();
  
  const {
    songsInPlaylist,
    isLoading,
    total,
    fetchPlaylistSongs,
    toggleLike,
  } = useSongs();

  const { user } = useUserContext(); 
  const { playerState, playerControls, playSong } = useMusicPlayer();

  // Use playlist name from URL or default to 'Liked Songs'
  const currentPlaylistName = playlistName ? decodeURIComponent(playlistName) : 'Liked Songs';

  useEffect(() => {
    fetchPlaylistSongs(user.id, currentPlaylistName, true);
  }, [fetchPlaylistSongs, user.id, currentPlaylistName]);

  const handlePlayLikedSongs = () => {
    const playlist = songsInPlaylist.map( song => song.song);
    playerControls.handlePlayClick(playlist);
  };

  // Handle song click to play
  const handleSongClick = (song: Song) => {
    const playlist = songsInPlaylist.map(song => song.song);
    playSong(song, playlist);
  };

  // Handle back to home page
  const handleBack = () => {
    navigate('/');
  };

  // Helper function to check if a song is currently selected in the player
  const isSongCurrentlySelected = (songId: string) => {
    return playerState.currentSong?.id === songId;
  };

  if (isLoading && songsInPlaylist.length === 0) {
    return (
      <div className={styles.page}>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          Loading your playlist...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.playlistHeader}>
        {playlistName && (
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={20} />
          </button>
        )}
        <div className={styles.playlistImage}>
          <Heart className={styles.playlistImageIcon} size={80} />
        </div>
        
        <div className={styles.playlistInfo}>
          <div className={styles.playlistType}>Playlist</div>
          <h1 className={styles.playlistTitle}>{currentPlaylistName}</h1>
          <div className={styles.playlistMeta}>
            {user.username} • {total} songs
          </div>
          
          <div className={styles.playlistActions}>
            <button className={styles.playButton} onClick={handlePlayLikedSongs}>
              {playerState.isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.songsSection}>
        <div className={styles.songsHeader}>
          <div className={styles.songsHeaderLeft}>
          </div>
          <div className={styles.songsHeaderRight}>
          </div>
        </div>

        <div className={styles.songsList}>
          {/* Column Headers */}
          <div className={styles.songHeader}>
            <div className={styles.headerNumber}>#</div>
            <div className={styles.headerSong}>Song</div>
            <div className={styles.headerAlbum}>Album</div>
            <div className={styles.headerDate}>Date Added</div>
            <div className={styles.headerDuration}>
              <Clock size={20} />
            </div>
            <div className={styles.headerHeart}></div>
          </div>
          
          {songsInPlaylist.map((item, index) => {
            const isCurrentlySelected = isSongCurrentlySelected(item.song.id);
            return (
              <div 
                key={item.id} 
                className={`${styles.songRow} ${isCurrentlySelected ? styles.playing : ''}`}
                onClick={() => handleSongClick(item.song)}
              >
                <div className={styles.songNumber}>
                  {isCurrentlySelected ? (
                    <div style={{ color: 'var(--primary)' }}>✓</div>
                  ) : (
                    index + 1
                  )}
                </div>
              
              <div className={styles.songInfo}>
                <div className={styles.songImage}>
                  <img 
                    src={item.song.imageUrl || ''} 
                    alt={item.song.album || ''}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </div>
                <div className={styles.songDetails}>
                  <div className={styles.songTitle}>
                    {item.song.title}
                    {item.song.isExplicit && <span className={styles.explicitBadge}>E</span>}
                  </div>
                  <div className={styles.songArtist}>{item.song.artist}</div>
                </div>
              </div>
              
              <div className={styles.songAlbum}>{item.song.album}</div>
              <div className={styles.songDate}>{formatDate(item.song.createdAt)}</div>
              <div className={styles.songDuration}>
                {formatDuration(item.song.duration)}
              </div>
              <div className={styles.songHeart}>
                <HeartButton isCurrentSongLiked={true} handleLikeClick={() => toggleLike(item.song.id, user.id, currentPlaylistName)} size={16} />
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Playlist;
