import { useCallback } from 'react';
import { useUserStore } from '../stores/userStore';

/**
 * Custom hook for managing user data
 * Provides a clean interface to the user store
 */
export const useUser = () => {
  const {
    user,
    isLoading,
    error,
    fetchUser,
    clearUser,
    clearError,
    reset,
  } = useUserStore();

  // Memoized actions to prevent unnecessary re-renders
  const handleFetchUser = useCallback(
    (userId: string) => {
      return fetchUser(userId);
    },
    [fetchUser]
  );

  const handleClearUser = useCallback(() => {
    clearUser();
  }, [clearUser]);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // Helper function to get user display name
  const getUserDisplayName = useCallback(() => {
    if (!user) return '';
    return `${user.firstName} ${user.lastName}`.trim() || user.username;
  }, [user]);

  // Helper function to check if user is active
  const isUserActive = useCallback(() => {
    return user?.isActive ?? false;
  }, [user]);

  return {
    // State
    user,
    isLoading,
    error,
    
    // Actions
    fetchUser: handleFetchUser,
    clearUser: handleClearUser,
    clearError: handleClearError,
    reset: handleReset,
    
    // Helpers
    getUserDisplayName,
    isUserActive,
  };
};
