import { ApiResponse } from "../types";

/**
 * Storage key for auth token
 */
const AUTH_TOKEN_KEY = "melodio_auth_token";

/**
 * Get the API base URL
 * Handles dynamic environments like HackerRank
 */
function getApiBaseUrl(): string {
	// First check for explicit environment variable
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL;
	}

	// For development, use the Vite proxy
	if (import.meta.env.DEV) {
		return "";
	}

	// Fallback: derive from current URL (for HackerRank-like environments)
	const { protocol, host } = window.location;
	return `${protocol}//${host.replace("4000", "6000")}`;
}

/**
 * API Service class for making HTTP requests
 * Uses native fetch API
 */
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

	/**
	 * Get the stored auth token
	 */
	public getAuthToken(): string | null {
		return localStorage.getItem(AUTH_TOKEN_KEY);
	}

	/**
	 * Set the auth token
	 */
	public setAuthToken(token: string): void {
		localStorage.setItem(AUTH_TOKEN_KEY, token);
	}

	/**
	 * Clear the auth token
	 */
	public clearAuthToken(): void {
		localStorage.removeItem(AUTH_TOKEN_KEY);
	}

	/**
	 * Build headers for the request
	 */
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

	/**
	 * Make a request to the API
	 */
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

		// Handle non-JSON responses
		const contentType = response.headers.get("content-type");
		if (!contentType?.includes("application/json")) {
			if (!response.ok) {
				throw new Error(`Request failed with status ${response.status}`);
			}
			return {} as T;
		}

		const data: ApiResponse<T> = await response.json();

		// Handle auth errors
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

	/**
	 * GET request
	 */
	public async get<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: "GET" });
	}

	/**
	 * POST request
	 */
	public async post<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "POST",
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	/**
	 * PUT request
	 */
	public async put<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "PUT",
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	/**
	 * PATCH request
	 */
	public async patch<T>(endpoint: string, body?: unknown): Promise<T> {
		return this.request<T>(endpoint, {
			method: "PATCH",
			body: body ? JSON.stringify(body) : undefined,
		});
	}

	/**
	 * DELETE request
	 */
	public async delete<T>(endpoint: string): Promise<T> {
		return this.request<T>(endpoint, { method: "DELETE" });
	}
}

export const apiService = ApiService.getInstance();
