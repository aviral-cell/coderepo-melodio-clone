import React from 'react';
import styles from './Header.module.css';
import { useUserContext } from '../../providers/UserProvider';
import Search from '../Search/Search';
import type { Song } from '../../types';

const Header: React.FC = () => {
  const { user } = useUserContext();

  const handleSongSelect = (song: Song) => {
    console.log('Selected song:', song);
    // TODO: Integrate with music player
    // This is where you would add the song to the player queue
  };

  return (
    <header className={styles.header}>
      <div className={styles.leftSection} />

      <Search 
        placeholder="What do you want to play?"
        onSongSelect={handleSongSelect}
      />
      
      <div className={styles.rightSection}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
