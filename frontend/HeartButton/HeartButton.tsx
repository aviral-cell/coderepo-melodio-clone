import { Heart } from "lucide-react";
import type React from "react";

import styles from './HeartButton.module.css';

interface HeartButtonProps {
  isCurrentSongLiked: boolean;
  handleLikeClick: () => void;
  size?: number;
}

const HeartButton: React.FC<HeartButtonProps> = ({ isCurrentSongLiked, handleLikeClick, size = 20 }) => {
  return (
    <button 
      className={`${styles.likeButton} ${isCurrentSongLiked ? styles.liked : ''}`}
      onClick={handleLikeClick}
    >
      <Heart 
        size={size} 
        fill={isCurrentSongLiked ? 'var(--secondary)' : 'none'}
        color={'var(--secondary)'}
      />
  </button>
  );
};

export default HeartButton;