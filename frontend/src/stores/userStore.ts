import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { usersApi } from '../services/api';
import type { User, ApiError } from '../types';

interface UserState {
  // State
  user: User | null;
  isLoading: boolean;
  error: ApiError | null;

  // Actions
  fetchUser: (userId: string) => Promise<void>;
  clearUser: () => void;
  clearError: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      error: null,

      // Actions
      fetchUser: async (userId: string) => {
        const { isLoading } = get();
        
        if (isLoading) return;

        set({ isLoading: true, error: null });

        try {
          const user = await usersApi.getUserById(userId);
          set({
            user: user,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error as ApiError,
            isLoading: false,
          });
        }
      },

      clearUser: () => {
        set({ user: null });
      },

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set({
          user: null,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'user-store',
    }
  )
);
