/**
 * @jest-environment jsdom
 */

/**
 * INTRO: Auth Context Tests
 *
 * Tests for the AuthContext provider which manages user authentication state.
 *
 * SCENARIO: Testing login, logout, register, and session restoration
 * EXPECTATION: Auth state is correctly managed across all operations
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockAuthService = {
	login: jest.fn(),
	register: jest.fn(),
	getMe: jest.fn(),
};

jest.mock("@/shared/services/auth.service", () => ({
	authService: mockAuthService,
}));

import { AuthProvider, useAuth } from "@/shared/contexts/AuthContext";

const mockUser = {
	_id: "user-123",
	email: "test@example.com",
	username: "testuser",
	displayName: "Test User",
	createdAt: "2023-01-01T00:00:00Z",
	updatedAt: "2023-01-01T00:00:00Z",
};

const mockAuthResponse = {
	user: mockUser,
	accessToken: "mock-token-123",
};

function TestComponent({ onError }: { onError?: (error: Error) => void }) {
	const { user, isAuthenticated, isLoading, login, logout, register } =
		useAuth();

	const handleLogin = async () => {
		try {
			await login({ email: "test@example.com", password: "password" });
		} catch (error) {
			onError?.(error as Error);
		}
	};

	const handleRegister = async () => {
		try {
			await register({
				email: "new@example.com",
				username: "newuser",
				displayName: "New User",
				password: "password123",
			});
		} catch (error) {
			onError?.(error as Error);
		}
	};

	return (
		<div>
			<div data-testid="loading">{isLoading ? "loading" : "not-loading"}</div>
			<div data-testid="authenticated">
				{isAuthenticated ? "authenticated" : "not-authenticated"}
			</div>
			<div data-testid="user">{user ? user.displayName : "no-user"}</div>
			<button data-testid="login-btn" onClick={handleLogin}>
				Login
			</button>
			<button data-testid="logout-btn" onClick={logout}>
				Logout
			</button>
			<button data-testid="register-btn" onClick={handleRegister}>
				Register
			</button>
		</div>
	);
}

describe("AuthContext", () => {
	beforeEach(() => {
		jest.clearAllMocks();
		localStorage.clear();
	});

	describe("Initial State", () => {
		it("should start with loading state", async () => {
			mockAuthService.getMe.mockRejectedValueOnce(new Error("No token"));

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			expect(screen.getByTestId("loading")).toHaveTextContent("loading");

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});
		});

		it("should have null user and not authenticated initially", async () => {
			mockAuthService.getMe.mockRejectedValueOnce(new Error("No token"));

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});

			expect(screen.getByTestId("user")).toHaveTextContent("no-user");
			expect(screen.getByTestId("authenticated")).toHaveTextContent(
				"not-authenticated"
			);
		});
	});

	describe("Login", () => {
		it("should login successfully and update state", async () => {
			mockAuthService.getMe.mockRejectedValueOnce(new Error("No token"));
			mockAuthService.login.mockResolvedValueOnce(mockAuthResponse);

			const user = userEvent.setup();

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});

			await user.click(screen.getByTestId("login-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("authenticated")).toHaveTextContent(
					"authenticated"
				);
			});

			expect(screen.getByTestId("user")).toHaveTextContent("Test User");
			expect(localStorage.getItem("accessToken")).toBe("mock-token-123");
		});

		it("should call error handler on login failure", async () => {
			mockAuthService.getMe.mockRejectedValueOnce(new Error("No token"));
			mockAuthService.login.mockRejectedValueOnce(new Error("Invalid credentials"));

			const user = userEvent.setup();
			const onError = jest.fn();

			render(
				<AuthProvider>
					<TestComponent onError={onError} />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});

			await user.click(screen.getByTestId("login-btn"));

			await waitFor(() => {
				expect(onError).toHaveBeenCalledWith(expect.any(Error));
			});

			expect(onError.mock.calls[0][0].message).toBe("Invalid credentials");
			expect(screen.getByTestId("authenticated")).toHaveTextContent(
				"not-authenticated"
			);
			expect(screen.getByTestId("user")).toHaveTextContent("no-user");
		});
	});

	describe("Register", () => {
		it("should register successfully and update state", async () => {
			mockAuthService.getMe.mockRejectedValueOnce(new Error("No token"));
			mockAuthService.register.mockResolvedValueOnce(mockAuthResponse);

			const user = userEvent.setup();

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});

			await user.click(screen.getByTestId("register-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("authenticated")).toHaveTextContent(
					"authenticated"
				);
			});

			expect(screen.getByTestId("user")).toHaveTextContent("Test User");
			expect(localStorage.getItem("accessToken")).toBe("mock-token-123");
		});

		it("should call error handler on registration failure", async () => {
			mockAuthService.getMe.mockRejectedValueOnce(new Error("No token"));
			mockAuthService.register.mockRejectedValueOnce(
				new Error("Email already exists")
			);

			const user = userEvent.setup();
			const onError = jest.fn();

			render(
				<AuthProvider>
					<TestComponent onError={onError} />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});

			await user.click(screen.getByTestId("register-btn"));

			await waitFor(() => {
				expect(onError).toHaveBeenCalledWith(expect.any(Error));
			});

			expect(onError.mock.calls[0][0].message).toBe("Email already exists");
			expect(screen.getByTestId("authenticated")).toHaveTextContent(
				"not-authenticated"
			);
		});
	});

	describe("Logout", () => {
		it("should clear auth state on logout", async () => {
			mockAuthService.getMe.mockRejectedValueOnce(new Error("No token"));
			mockAuthService.login.mockResolvedValueOnce(mockAuthResponse);

			const user = userEvent.setup();

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});

			// Login first
			await user.click(screen.getByTestId("login-btn"));

			await waitFor(() => {
				expect(screen.getByTestId("authenticated")).toHaveTextContent(
					"authenticated"
				);
			});

			// Then logout
			await user.click(screen.getByTestId("logout-btn"));

			expect(screen.getByTestId("authenticated")).toHaveTextContent(
				"not-authenticated"
			);
			expect(screen.getByTestId("user")).toHaveTextContent("no-user");
			expect(localStorage.getItem("accessToken")).toBeNull();
		});
	});

	describe("Session Restoration", () => {
		it("should restore session from stored token on mount", async () => {
			localStorage.setItem("accessToken", "stored-token");
			mockAuthService.getMe.mockResolvedValueOnce(mockUser);

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});

			expect(screen.getByTestId("authenticated")).toHaveTextContent(
				"authenticated"
			);
			expect(screen.getByTestId("user")).toHaveTextContent("Test User");
			expect(mockAuthService.getMe).toHaveBeenCalled();
		});

		it("should clear invalid token on mount", async () => {
			localStorage.setItem("accessToken", "invalid-token");
			mockAuthService.getMe.mockRejectedValueOnce(new Error("Unauthorized"));

			render(
				<AuthProvider>
					<TestComponent />
				</AuthProvider>
			);

			await waitFor(() => {
				expect(screen.getByTestId("loading")).toHaveTextContent("not-loading");
			});

			expect(screen.getByTestId("authenticated")).toHaveTextContent(
				"not-authenticated"
			);
			expect(screen.getByTestId("user")).toHaveTextContent("no-user");
			expect(localStorage.getItem("accessToken")).toBeNull();
		});
	});

	describe("useAuth hook", () => {
		it("should throw error when used outside AuthProvider", () => {
			const consoleError = jest
				.spyOn(console, "error")
				.mockImplementation(() => {});

			expect(() => {
				render(<TestComponent />);
			}).toThrow("useAuth must be used within an AuthProvider");

			consoleError.mockRestore();
		});
	});
});
