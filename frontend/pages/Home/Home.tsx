import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MediaRow from '../../components/MediaRow/MediaRow';
import { usePlaylists } from '../../stores/playlistStore';
import { useUserContext } from '../../providers/UserProvider';
import { useSongs } from '../../hooks';
import { useMusicPlayer } from '../../stores/musicPlayerStore';
import playlistCover from '../../assets/playlist_cover.png';
import styles from './Home.module.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUserContext();
  const {
    userPlaylists,
    fetchUserPlaylists,
  } = usePlaylists();
  
  const {
    songsInPlaylist,
    isLoading: likedSongsLoading,
    error: likedSongsError,
    fetchPlaylistSongs,
    clearError: clearLikedSongsError,
  } = useSongs();
  
  const { playSong } = useMusicPlayer();

  useEffect(() => {
    if (user.id) {
      fetchUserPlaylists(user.id);
      fetchPlaylistSongs(user.id, 'Liked Songs', true);
    }
  }, [fetchUserPlaylists, fetchPlaylistSongs, user.id]);

  const handlePlaylistClick = (playlistName: string) => {
    // Navigate to playlist URL
    const encodedPlaylistName = encodeURIComponent(playlistName);
    navigate(`/playlist/${encodedPlaylistName}`);
  };

  const handleLikedSongClick = (item: { id: string; image: string; primaryText: string; secondaryText?: string }) => {
    // Find the song in the liked songs list
    const likedSong = songsInPlaylist.find(ls => ls.song.id === item.id);
    if (likedSong) {
      // Extract songs from playlist entries for the queue
      const songs = songsInPlaylist.map(ls => ls.song);
      // Play the specific clicked song with the full liked songs queue
      playSong(likedSong.song, songs);
    }
  };

  return (
    <div className={styles.home}>
      <div className={styles.content}>
        <MediaRow
          title="My Playlists"
          items={userPlaylists.map(playlist => ({
            id: playlist.playlistName,
            image: playlistCover,
            primaryText: playlist.playlistName,
            secondaryText: `${playlist.songCount} songs`
          }))}
          onItemClick={(item) => handlePlaylistClick(item.id)}
        />
        
        {/* Liked Songs Section */}
        {likedSongsError ? (
          <div className={styles.errorState}>
            <span>Error loading liked songs: {likedSongsError.message}</span>
            <button onClick={clearLikedSongsError} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : likedSongsLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Loading liked songs...</span>
          </div>
        ) : (
          <MediaRow
            title="Liked Songs"
            items={songsInPlaylist.slice(0, 6).map(playlistEntry => ({
              id: playlistEntry.song.id,
              image: playlistEntry.song.imageUrl || playlistCover,
              primaryText: playlistEntry.song.title,
              secondaryText: playlistEntry.song.artist
            }))}
            onItemClick={handleLikedSongClick}
            onViewAllClick={() => navigate('/liked-songs')}
            showViewAll={songsInPlaylist.length > 6}
          />
        )}
      </div>
    </div>
  );
};

export default Home;
