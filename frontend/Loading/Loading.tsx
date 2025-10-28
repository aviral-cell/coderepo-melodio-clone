import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './Loading.module.css';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}

const Loading: React.FC<LoadingProps> = ({ size = 'md', message = 'Loading...' }) => {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        <Loader2 className={`${styles.spinner} ${styles[size]}`} />
        {message && <p className={styles.loadingMessage}>{message}</p>}
      </div>
    </div>
  );
};

export default Loading;
