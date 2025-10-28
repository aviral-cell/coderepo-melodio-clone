import React, { useRef } from 'react';
import MediaCard from '../MediaCard/MediaCard';
import styles from './MediaRow.module.css';

export interface MediaItem {
  id: string;
  image: string;
  primaryText: string;
  secondaryText?: string;
}

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  onItemClick?: (item: MediaItem) => void;
  onViewAllClick?: () => void;
  showViewAll?: boolean;
  className?: string;
}

const MediaRow: React.FC<MediaRowProps> = ({
  title,
  items,
  onItemClick,
  onViewAllClick,
  showViewAll = false,
  className = ''
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 200,
        behavior: 'smooth'
      });
    }
  };

  if (items.length === 0) {
    return (
      <div className={`${styles.mediaRow} ${className}`}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.emptyState}>
          <p>No items available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.mediaRow} ${className}`}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <div className={styles.headerControls}>
          {showViewAll && onViewAllClick && (
            <button 
              className={styles.viewAllButton}
              onClick={onViewAllClick}
              type="button"
            >
              View All
            </button>
          )}
          <div className={styles.scrollControls}>
            <button 
              className={styles.scrollButton}
              onClick={scrollLeft}
              aria-label="Scroll left"
              type="button"
            >
              ←
            </button>
            <button 
              className={styles.scrollButton}
              onClick={scrollRight}
              aria-label="Scroll right"
              type="button"
            >
              →
            </button>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className={styles.mediaContainer}
        role="region"
        aria-label={title}
      >
        <div className={styles.mediaList}>
          {items.map((item) => (
            <MediaCard
              key={item.id}
              image={item.image}
              primaryText={item.primaryText}
              secondaryText={item.secondaryText}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MediaRow;
