import { ApiResponse } from "../types";

const AUTH_TOKEN_KEY = "accessToken";

function getApiBaseUrl(): string {
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL;
	}

	if (import.meta.env.DEV) {
		return "";
	}

	const { protocol, host } = window.location;
	return `${protocol}//${host.replace("4000", "6000")}`;
}

class ApiService {
	private static instance: ApiService;
	private baseUrl: string;

	private constructor() {
		this.baseUrl = getApiBaseUrl();
	}

	public static getInstance(): ApiService {
		if (!ApiService.instance) {
			ApiService.instance = new ApiService();
		}
		return ApiService.instance;
	}

	public getAuthToken(): string | null {
		return localStorage.getItem(AUTH_TOKEN_KEY);
	}

	public setAuthToken(token: string): void {
		localStorage.setItem(AUTH_TOKEN_KEY, token);
	}

	public clearAuthToken(): void {
		localStorage.removeItem(AUTH_TOKEN_KEY);
	}

	private buildHeaders(customHeaders?: Record<string, string>): Headers {
		const headers = new Headers({
			"Content-Type": "application/json",
			...customHeaders,
		});

		const token = this.getAuthToken();
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}

		return headers;
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {},
	): Promise<T> {
		const url = `${this.baseUrl}${endpoint}`;

		const config: RequestInit = {
			...options,
			headers: this.buildHeaders(
				options.headers as Record<string, string> | undefined,
			),
		};

		const response = await fetch(url, config);

		const contentType = response.headers.get("content-type");
		if (!contentType?.includes("application/json")) {
			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}
			return {} as T;
		}

		const data: ApiResponse<T> = await response.json();

		if (response.status === 401) {
			this.clearAuthToken();
			throw new Error(data.error || "Unauthorized");
		}

		if (!response.ok || !data.success) {
			const errorMessage = data.error || data.message || "Request failed";
			throw new Error(errorMessage);
		}

		return data.data as T;
	}

	public async get<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: "GET" });
	}

	public async post<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "POST",
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	public async put<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "PUT",
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	public async patch<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "PATCH",
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	public async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: "DELETE" });
	}
}

export const apiService = ApiService.getInstance();
