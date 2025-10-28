import React from 'react';

export const UserLoadingFallback: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: 'var(--spotify-dark-gray)',
      color: 'var(--spotify-text-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid var(--spotify-light-gray)',
          borderTop: '3px solid var(--spotify-green)',
          borderRadius: 'var(--radius-full)',
          animation: 'spin 1s linear infinite',
          margin: '0 auto var(--spacing-md)'
        }} />
        <p style={{ 
          fontSize: 'var(--font-size-base)',
          color: 'var(--spotify-text-secondary)'
        }}>
          Loading user data...
        </p>
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
