import { useCallback } from 'react';
import { useSearchStore } from '../stores/searchStore';

/**
 * Custom hook for managing song search
 * Provides a clean interface to the search store
 */
export const useSearch = () => {
  const {
    searchResults,
    isLoading,
    error,
    query,
    total,
    page,
    limit,
    totalPages,
    hasSearched,
    searchSongs,
    loadMoreResults,
    clearSearch,
    clearError,
    reset,
  } = useSearchStore();

  // Memoized actions to prevent unnecessary re-renders
  const handleSearch = useCallback(
    (searchQuery: string, searchLimit?: number, offset?: number) => {
      return searchSongs(searchQuery, searchLimit, offset);
    },
    [searchSongs]
  );

  const handleLoadMore = useCallback(() => {
    return loadMoreResults();
  }, [loadMoreResults]);

  const handleClearSearch = useCallback(() => {
    clearSearch();
  }, [clearSearch]);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  const handleReset = useCallback(() => {
    reset();
  }, [reset]);

  // Helper function to check if there are more results to load
  const canLoadMore = useCallback(() => {
    return !isLoading && hasSearched && page < totalPages;
  }, [isLoading, hasSearched, page, totalPages]);

  // Helper function to check if search is empty
  const isEmpty = useCallback(() => {
    return hasSearched && searchResults.length === 0 && !isLoading;
  }, [hasSearched, searchResults.length, isLoading]);

  return {
    // State
    searchResults,
    isLoading,
    error,
    query,
    total,
    page,
    limit,
    totalPages,
    hasSearched,
    
    // Actions
    search: handleSearch,
    loadMore: handleLoadMore,
    clearSearch: handleClearSearch,
    clearError: handleClearError,
    reset: handleReset,
    
    // Helpers
    canLoadMore,
    isEmpty,
  };
};
