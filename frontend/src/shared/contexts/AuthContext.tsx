import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from "react";
import { User } from "../types";
import {
	authService,
	AuthResponse,
	LoginInput,
	RegisterInput,
} from "../services/auth.service";

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

interface AuthContextType extends AuthState {
	login: (input: LoginInput) => Promise<void>;
	register: (input: RegisterInput) => Promise<void>;
	logout: () => void;
	switchAccount: (targetUserId: string) => Promise<void>;
	refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, setState] = useState<AuthState>({
		user: null,
		token: null,
		isAuthenticated: false,
		isLoading: true,
	});

	useEffect(() => {
		const initAuth = async () => {
			const storedToken = localStorage.getItem("accessToken");

			if (storedToken) {
				try {
					const user = await authService.getMe();
					setState({
						user,
						token: storedToken,
						isAuthenticated: true,
						isLoading: false,
					});
				} catch {
					localStorage.removeItem("accessToken");
					setState({
						user: null,
						token: null,
						isAuthenticated: false,
						isLoading: false,
					});
				}
			} else {
				setState((prev) => ({ ...prev, isLoading: false }));
			}
		};

		initAuth();
	}, []);

	const handleAuthSuccess = useCallback((response: AuthResponse) => {
		localStorage.setItem("accessToken", response.accessToken);
		setState({
			user: response.user,
			token: response.accessToken,
			isAuthenticated: true,
			isLoading: false,
		});
	}, []);

	const login = useCallback(
		async (input: LoginInput) => {
			const response = await authService.login(input);
			handleAuthSuccess(response);
		},
		[handleAuthSuccess]
	);

	const register = useCallback(
		async (input: RegisterInput) => {
			const response = await authService.register(input);
			handleAuthSuccess(response);
		},
		[handleAuthSuccess]
	);

	const logout = useCallback(() => {
		localStorage.removeItem("accessToken");
		setState({
			user: null,
			token: null,
			isAuthenticated: false,
			isLoading: false,
		});
	}, []);

	const switchAccount = useCallback(async (targetUserId: string) => {
		const response = await authService.switchAccount({ targetUserId });
		localStorage.setItem("accessToken", response.token);
		setState({
			user: response.user,
			token: response.token,
			isAuthenticated: true,
			isLoading: false,
		});
	}, []);

	const refreshUser = useCallback(async () => {
		const storedToken = localStorage.getItem("accessToken");
		if (storedToken) {
			const user = await authService.getMe();
			setState((prev) => ({
				...prev,
				user,
			}));
		}
	}, []);

	return (
		<AuthContext.Provider
			value={{
				...state,
				login,
				register,
				logout,
				switchAccount,
				refreshUser,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth(): AuthContextType {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
