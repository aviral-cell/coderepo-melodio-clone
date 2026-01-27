import { apiService } from "./api.service";
import type { User, AccountType, SubscriptionStatus } from "../types";

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

interface BackendUserResponse {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	accountType?: AccountType;
	primaryAccountId?: string | null;
	subscriptionStatus?: SubscriptionStatus;
	createdAt?: string;
	updatedAt?: string;
}

interface BackendAuthResponse {
	user: BackendUserResponse;
	accessToken: string;
}

interface BackendSwitchResponse {
	token: string;
	user: BackendUserResponse & { _id?: string };
}

export interface AuthResponse {
	user: User;
	accessToken: string;
}

export interface SwitchAccountInput {
	targetUserId: string;
}

export interface SwitchAccountResponse {
	token: string;
	user: User;
}

function mapBackendUser(backendUser: BackendUserResponse): User {
	return {
		_id: backendUser.id,
		email: backendUser.email,
		username: backendUser.username,
		displayName: backendUser.displayName,
		avatarUrl: backendUser.avatarUrl,
		accountType: backendUser.accountType,
		primaryAccountId: backendUser.primaryAccountId || undefined,
		subscriptionStatus: backendUser.subscriptionStatus,
		createdAt: backendUser.createdAt || new Date().toISOString(),
		updatedAt: backendUser.updatedAt || new Date().toISOString(),
	};
}

export const authService = {
	async register(input: RegisterInput): Promise<AuthResponse> {
		const response = await apiService.post<BackendAuthResponse>("/api/auth/register", input);
		return {
			accessToken: response.accessToken,
			user: mapBackendUser(response.user),
		};
	},

	async login(input: LoginInput): Promise<AuthResponse> {
		const response = await apiService.post<BackendAuthResponse>("/api/auth/login", input);
		return {
			accessToken: response.accessToken,
			user: mapBackendUser(response.user),
		};
	},

	async getMe(): Promise<User> {
		const response = await apiService.get<BackendUserResponse>("/api/auth/me");
		return mapBackendUser(response);
	},

	async switchAccount(input: SwitchAccountInput): Promise<SwitchAccountResponse> {
		const response = await apiService.post<BackendSwitchResponse>("/api/auth/switch", input);
		return {
			token: response.token,
			user: {
				_id: response.user._id || response.user.id,
				email: response.user.email,
				username: response.user.username || "",
				displayName: response.user.displayName,
				avatarUrl: response.user.avatarUrl,
				accountType: response.user.accountType,
				primaryAccountId: response.user.primaryAccountId || undefined,
				subscriptionStatus: response.user.subscriptionStatus,
				createdAt: response.user.createdAt || new Date().toISOString(),
				updatedAt: response.user.updatedAt || new Date().toISOString(),
			},
		};
	},
};
