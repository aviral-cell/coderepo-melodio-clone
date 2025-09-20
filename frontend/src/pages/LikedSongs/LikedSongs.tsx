import React from 'react';
import { Play, MoreHorizontal, Heart, Clock } from 'lucide-react';
import { mockLikedSongsPlaylist, formatDuration } from '../../services/mockData';
import styles from './LikedSongs.module.css';

const LikedSongs: React.FC = () => {
  const { name, owner, songCount, songs } = mockLikedSongsPlaylist;

  return (
    <div className={styles.page}>
      <div className={styles.playlistHeader}>
        <div className={styles.playlistImage}>
          <Heart className={styles.playlistImageIcon} size={80} />
        </div>
        
        <div className={styles.playlistInfo}>
          <div className={styles.playlistType}>Playlist</div>
          <h1 className={styles.playlistTitle}>{name}</h1>
          <div className={styles.playlistMeta}>
            {owner} • {songCount} songs
          </div>
          
          <div className={styles.playlistActions}>
            <button className={styles.playButton}>
              <Play size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.songsSection}>
        <div className={styles.songsHeader}>
          <div className={styles.songsHeaderLeft}>
            <button className={styles.headerButton}>
              <MoreHorizontal size={20} />
            </button>
          </div>
          <div className={styles.songsHeaderRight}>
            <button className={styles.headerButton}>
              <Clock size={20} />
            </button>
          </div>
        </div>

        <div className={styles.songsList}>
          {songs.map((song, index) => (
            <div 
              key={song.id} 
              className={`${styles.songRow} ${song.isPlaying ? styles.playing : ''}`}
            >
              <div className={styles.songNumber}>
                {song.isPlaying ? (
                  <div style={{ color: 'var(--primary)' }}>✓</div>
                ) : (
                  index + 1
                )}
              </div>
              
              <div className={styles.songInfo}>
                <div className={styles.songImage}>
                  <img 
                    src={song.albumArt} 
                    alt={song.album}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px' }}
                  />
                </div>
                <div className={styles.songDetails}>
                  <div className={styles.songTitle}>
                    {song.title}
                    {song.explicit && <span className={styles.explicitBadge}>E</span>}
                  </div>
                  <div className={styles.songArtist}>{song.artist}</div>
                </div>
              </div>
              
              <div className={styles.songAlbum}>{song.album}</div>
              <div className={styles.songDate}>{song.dateAdded}</div>
              <div className={styles.songDuration}>
                {formatDuration(song.duration)}
              </div>
              
              <div className={styles.songActions}>
                <button className={styles.actionButton}>
                  <Heart size={16} />
                </button>
                <button className={styles.actionButton}>
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LikedSongs;
