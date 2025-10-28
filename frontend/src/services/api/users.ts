import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type { User } from '../../types';

export const usersApi = {
  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User> {
    return apiClient.get<User>(`${API_ENDPOINTS.USERS}/${userId}`);
  },
};
