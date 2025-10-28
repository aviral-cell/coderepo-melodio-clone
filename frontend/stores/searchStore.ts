import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { songsApi } from '../services/api';
import type { Song, ApiError } from '../types';

interface SearchState {
  // State
  searchResults: Song[];
  isLoading: boolean;
  error: ApiError | null;
  query: string;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasSearched: boolean;

  // Actions
  searchSongs: (query: string, limit?: number, offset?: number) => Promise<void>;
  loadMoreResults: () => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useSearchStore = create<SearchState>()(
  devtools(
    (set, get) => ({
      // Initial state
      searchResults: [],
      isLoading: false,
      error: null,
      query: '',
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasSearched: false,

      // Actions
      searchSongs: async (query: string, limit = 10, offset = 0) => {
        const { isLoading } = get();
        
        if (isLoading || !query.trim()) return;

        set({ 
          isLoading: true, 
          error: null,
          query: query.trim(),
          hasSearched: true,
        });

        try {
          const response = await songsApi.searchSongs(query.trim(), limit, offset);
          
          set({
            searchResults: response.data,
            total: response.total,
            page: response.page,
            limit: response.limit,
            totalPages: response.totalPages,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error as ApiError,
            isLoading: false,
          });
        }
      },

      loadMoreResults: async () => {
        const { isLoading, query, searchResults, page, limit, totalPages } = get();
        
        if (isLoading || page >= totalPages) return;

        set({ isLoading: true, error: null });

        try {
          const nextOffset = page * limit;
          const response = await songsApi.searchSongs(query, limit, nextOffset);
          
          set({
            searchResults: [...searchResults, ...response.data],
            page: response.page,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error as ApiError,
            isLoading: false,
          });
        }
      },

      clearSearch: () => {
        set({
          searchResults: [],
          query: '',
          total: 0,
          page: 1,
          totalPages: 0,
          hasSearched: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          searchResults: [],
          isLoading: false,
          error: null,
          query: '',
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
          hasSearched: false,
        });
      },
    }),
    {
      name: 'search-store',
    }
  )
);
