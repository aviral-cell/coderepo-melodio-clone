import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Heart } from 'lucide-react';
import styles from './Sidebar.module.css';
import MusicIcon from './MusicIcon';

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <MusicIcon size={30} color='var(--secondary)' />
      </div>
      
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link 
              to="/" 
              className={`${styles.navLink} ${location.pathname === '/' ? styles.active : ''}`}
            >
              <Home className={styles.navIcon} />
            </Link>
          </li>
          <li className={styles.navItem}>
            <Link 
              to="/liked-songs" 
              className={`${styles.navLink} ${location.pathname === '/liked-songs' ? styles.active : ''}`}
            >
              <Heart className={styles.likedSongsIcon} />
            </Link>
          </li>
        </ul>

      </nav>
    </aside>
  );
};

export default Sidebar;
