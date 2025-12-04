import { apiService } from './api.service';
import { AuthResponse, LoginInput, RegisterInput, User } from '../types/user.types';

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/register', input, { skipAuth: true });
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    return apiService.post<AuthResponse>('/auth/login', input, { skipAuth: true });
  },

  async getMe(): Promise<User> {
    return apiService.get<User>('/auth/me');
  },
};
