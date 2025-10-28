import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '../hooks/useUser';
import type { User } from '../types';

interface UserContextType {
  user: User;
  isLoading: boolean;
  error: Error | null;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  children: React.ReactNode;
  userId: string;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, userId }) => {
  const { user, isLoading, error, fetchUser } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        console.log('Initializing user:', userId);
        await fetchUser(userId);
        setIsInitialized(true);
      } catch (err) {
        console.error('Error initializing user', err);
        setIsInitialized(true);
      }
    };

    initializeUser();
  }, [fetchUser, userId]);


  if (!isInitialized || isLoading) {
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
          <p>Loading user data...</p>
        </div>
        
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error('User not found');
  }

  return (
    <UserContext.Provider value={{ user, isLoading, error }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
