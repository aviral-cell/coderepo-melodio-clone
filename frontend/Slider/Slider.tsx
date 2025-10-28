import React from 'react';
import styles from './Slider.module.css';

interface SliderProps {
  value: number; // Current value (0-100)
  max?: number; // Maximum value (default: 100)
  onChange: (value: number) => void; // Callback when value changes
  disabled?: boolean;
  className?: string;
  showHandle?: boolean; // Whether to show the handle indicator
  size?: 'small' | 'medium' | 'large'; // Size variant
}

const Slider: React.FC<SliderProps> = ({
  value,
  max = 100,
  onChange,
  disabled = false,
  className = '',
  showHandle = true,
  size = 'medium'
}) => {
  const percentage = Math.max(0, Math.min(100, (value / max) * 100));

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newValue = percentage * max;
    onChange(Math.round(newValue));
  };

  const sliderClasses = [
    styles.slider,
    styles[size],
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={sliderClasses}
      onClick={handleSliderClick}
      style={{ cursor: disabled ? 'default' : 'pointer' }}
    >
      <div 
        className={styles.sliderFill} 
        style={{ width: `${percentage}%` }}
      />
      {showHandle && (
        <div 
          className={styles.sliderHandle} 
          style={{ left: `${percentage}%` }}
        />
      )}
    </div>
  );
};

export default Slider;
