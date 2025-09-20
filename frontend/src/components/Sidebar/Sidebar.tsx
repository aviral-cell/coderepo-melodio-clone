import React from 'react';
import { Home, Search, Heart } from 'lucide-react';
import hackifyLogo from '../../assets/hackify_logo.svg';
import styles from './Sidebar.module.css';

const Sidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <img src={hackifyLogo} alt="Hackify" className={styles.logoIcon} />
      </div>
      
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Home  className={styles.navIcon} />
          </li>
          <li className={styles.navItem}>
            <Search className={styles.navIcon} />
          </li>
          <div className={`${styles.navItem} ${styles.active}`}>
            <Heart className={styles.likedSongsIcon} />
          </div>
        </ul>

      </nav>
    </aside>
  );
};

export default Sidebar;
