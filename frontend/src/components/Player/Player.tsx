import React from 'react';
import { 
  Shuffle, 
  SkipBack, 
  Play, 
  Pause, 
  SkipForward, 
  Repeat, 
  Heart, 
  Mic, 
  List, 
  Monitor, 
  Volume2, 
  Maximize2 
} from 'lucide-react';
import { mockSongs } from '../../services/mockData';
import styles from './Player.module.css';

const Player: React.FC = () => {
  const currentSong = mockSongs[0]; // First song is currently playing
  const isPlaying = true;
  const currentTime = 0;
  const duration = currentSong.duration;
  const volume = 30;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.player}>
      <div className={styles.leftSection}>
        <div className={styles.songInfo}>
          <div className={styles.songImage}>
            <img 
              src={currentSong.albumArt} 
              alt={currentSong.album}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
            />
          </div>
          <div className={styles.songDetails}>
            <div className={styles.songTitle}>{currentSong.title}</div>
            <div className={styles.songArtist}>{currentSong.artist}</div>
          </div>
        </div>
        <button className={`${styles.likeButton} ${styles.liked}`}>
          <Heart size={16} />
        </button>
      </div>

      <div className={styles.centerSection}>
        <div className={styles.playerControls}>
          <button className={`${styles.controlButton} ${styles.active}`}>
            <Shuffle size={16} />
          </button>
          <button className={styles.controlButton}>
            <SkipBack size={20} />
          </button>
          <button className={styles.playButton}>
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <button className={styles.controlButton}>
            <SkipForward size={20} />
          </button>
          <button className={styles.controlButton}>
            <Repeat size={16} />
          </button>
        </div>
        
        <div className={styles.progressSection}>
          <span className={styles.timeDisplay}>{formatTime(currentTime)}</span>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: '0%' }}></div>
            <div className={styles.progressHandle}></div>
          </div>
          <span className={styles.timeDisplay}>{formatTime(duration)}</span>
        </div>
      </div>

      <div className={styles.rightSection}>
        <button className={styles.controlButton}>
          <Mic size={16} />
        </button>
        <button className={styles.controlButton}>
          <List size={16} />
        </button>
        <button className={styles.controlButton}>
          <Monitor size={16} />
        </button>
        <div className={styles.volumeSection}>
          <button className={styles.volumeButton}>
            <Volume2 size={16} />
          </button>
          <div className={styles.volumeSlider}>
            <div className={styles.volumeFill} style={{ width: `${volume}%` }}></div>
            <div className={styles.volumeHandle}></div>
          </div>
        </div>
        <button className={styles.fullscreenButton}>
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Player;
