import React from 'react';
import { Play } from 'lucide-react';
import styles from './MediaCard.module.css';

interface MediaCardProps {
  image: string;
  primaryText: string;
  secondaryText?: string;
  onClick?: () => void;
  className?: string;
}

const MediaCard: React.FC<MediaCardProps> = ({ 
  image,
  primaryText,
  secondaryText,
  onClick,
  className = '' 
}) => {
  return (
    <div 
      className={`${styles.mediaCard} ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className={styles.imageContainer}>
        <img 
          src={image} 
          alt={primaryText}
          className={styles.mediaImage}
          loading="lazy"
        />
      </div>
      
      <button 
        className={styles.playButton}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        aria-label={`Play ${primaryText}`}
        type="button"
      >
        <Play size={16} fill="currentColor" />
      </button>
      
      <div className={styles.mediaInfo}>
        <h3 className={styles.mainText} title={primaryText}>
          {primaryText}
        </h3>
        {secondaryText && (
          <p className={styles.secondaryText} title={secondaryText}>
            {secondaryText}
          </p>
        )}
      </div>
    </div>
  );
};

export default MediaCard;
