import { apiService } from "./api.service";
import type { User } from "../types";

export interface LoginInput {
	email: string;
	password: string;
}

export interface RegisterInput {
	email: string;
	username: string;
	displayName: string;
	password: string;
}

export interface AuthResponse {
	user: User;
	accessToken: string;
}

export const authService = {
	async register(input: RegisterInput): Promise<AuthResponse> {
		return apiService.post<AuthResponse>("/api/auth/register", input);
	},

	async login(input: LoginInput): Promise<AuthResponse> {
		return apiService.post<AuthResponse>("/api/auth/login", input);
	},

	async getMe(): Promise<User> {
		return apiService.get<User>("/api/auth/me");
	},
};
