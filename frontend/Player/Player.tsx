import React from 'react';
import { 
  Shuffle, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Repeat, 
  Mic, 
  List, 
  Monitor, 
  Volume2, 
  Maximize2 
} from 'lucide-react';
import styles from './Player.module.css';
import { useMusicPlayer } from '../../stores/musicPlayerStore';
import { useSongs } from '../../hooks/useSongs';
import { useUserContext } from '../../providers/UserProvider';
import HeartButton from '../HeartButton/HeartButton';
import Slider from '../Slider/Slider';

const Player: React.FC = () => {
  const { playerState, playerControls } = useMusicPlayer();
  const { songsInPlaylist, isSongLiked, toggleLike } = useSongs();

  const { user } = useUserContext();

  const handlePlay = () => {
    const playlist = songsInPlaylist.map(song => song.song);
    playerControls.handlePlayClick(playlist);
  };

  const { isPlaying, currentTime, volume } = playerState;
  const duration = playerState.currentSong?.duration || 0;

  // Check if current song is liked
  const isCurrentSongLiked = playerState.currentSong 
    ? isSongLiked(playerState.currentSong.id)
    : false;


  // Handle like button click
  const handleLikeClick = async () => {
    if (!playerState.currentSong) return;
    await toggleLike(playerState.currentSong.id, user.id);
  };


  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSeekChange = (percentage: number) => {
    if (!playerState.currentSong) return;
    const newTime = (percentage / 100) * duration;
    playerControls.seek(newTime);
  };


  const handleVolumeChange = (volume: number) => {
    playerControls.setVolume(volume);
  };


  return (
    <div className={styles.player}>
      <div className={styles.leftSection}>
        {playerState.currentSong && (
          <>
            <div className={styles.songInfo}>
              <div className={styles.songImage}>
                <img 
                  src={playerState.currentSong.imageUrl || ''} 
                  alt={playerState.currentSong.album || 'Album'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                />
              </div>
              <div className={styles.songDetails}>
                <div className={styles.songTitle}>{playerState.currentSong.title}</div>
                <div className={styles.songArtist}>{playerState.currentSong.artist}</div>
              </div>
            </div>
            <HeartButton isCurrentSongLiked={isCurrentSongLiked} handleLikeClick={handleLikeClick} />
          </>
        )}
      </div>

      <div className={styles.centerSection}>
        <div className={styles.playerControls}>
          <button 
            className={`${styles.controlButton} ${playerState.isShuffled ? styles.active : ''}`}
            onClick={playerControls.toggleShuffle}
          >
            <Shuffle size={16} />
          </button>
          <button 
            className={styles.controlButton}
            onClick={playerControls.previous}
            disabled={!playerState.currentSong}
          >
            <SkipBack size={20} />
          </button>
          <button 
            className={styles.playButton}
            onClick={handlePlay}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button 
            className={styles.controlButton}
            onClick={playerControls.next}
            disabled={!playerState.currentSong}
          >
            <SkipForward size={20} />
          </button>
          <button 
            className={`${styles.controlButton} ${playerState.isRepeating ? styles.active : ''}`}
            onClick={playerControls.toggleRepeat}
          >
            <Repeat size={16} />
          </button>
        </div>
        
        <div className={styles.progressSection}>
          <span className={styles.timeDisplay}>{formatTime(currentTime)}</span>
          <Slider
            value={progressPercentage}
            max={100}
            onChange={handleSeekChange}
            disabled={!playerState.currentSong}
            size="medium"
            showHandle={true}
          />
          <span className={styles.timeDisplay}>{formatTime(duration)}</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        <button className={`${styles.controlButton} ${styles.disabled}`}>
          <Mic size={16} />
        </button>
        <button className={`${styles.controlButton} ${styles.disabled}`}>
          <List size={16} />
        </button>
        <button className={`${styles.controlButton} ${styles.disabled}`}>
          <Monitor size={16} />
        </button>
        <div className={styles.volumeSection}>
          <button className={styles.volumeButton}>
            <Volume2 size={16} />
          </button>
          <Slider
            value={volume}
            max={100}
            onChange={handleVolumeChange}
            size="small"
            showHandle={true}
          />
        </div>
        <button className={styles.fullscreenButton}>
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Player;
