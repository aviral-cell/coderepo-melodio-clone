import React from 'react';
import { Search } from 'lucide-react';
import { mockUser } from '../../services/mockData';
import styles from './Header.module.css';

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.leftSection} />

      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={16} />
        <input
          type="text"
          placeholder="What do you want to play?"
          className={styles.searchInput}
          style={{ borderRadius: '16px' }}
        />
      </div>
      
      <div className={styles.rightSection}>
        <div className={styles.userProfile}>
          <div className={styles.userAvatar}>
            {mockUser.name.charAt(0).toUpperCase()}
          </div>
          <span className={styles.userName}>{mockUser.name}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
