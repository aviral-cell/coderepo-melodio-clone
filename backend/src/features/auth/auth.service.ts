import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { usersService } from "../users/users.service.js";

export interface RegisterData {
	email: string;
	username: string;
	password: string;
	displayName: string;
}

export interface LoginData {
	email: string;
	password: string;
}

export interface AuthResponse {
	accessToken: string;
	user: {
		id: string;
		email: string;
		username: string;
		displayName: string;
		avatarUrl?: string;
	};
}

export interface UserResponse {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
}

export class AuthError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.name = "AuthError";
	}
}

function getJwtSecret(): string {
	const secret = process.env["JWT_SECRET"];
	if (!secret) {
		throw new Error("JWT_SECRET is not configured");
	}
	return secret;
}

function getJwtExpiresIn(): string {
	return process.env["JWT_EXPIRES_IN"] || "7d";
}

function generateToken(payload: { userId: string; email: string; username: string }): string {
	const secret = getJwtSecret();
	const expiresIn = getJwtExpiresIn();
	return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export const authService = {
	async register(data: RegisterData): Promise<AuthResponse> {
		const existingEmail = await usersService.findByEmail(data.email);
		if (existingEmail) {
			throw new AuthError("Email already registered", 409);
		}

		const existingUsername = await usersService.findByUsername(data.username);
		if (existingUsername) {
			throw new AuthError("Username already taken", 409);
		}

		const saltRounds = 10;
		const passwordHash = await bcrypt.hash(data.password, saltRounds);

		const user = await usersService.create({
			email: data.email,
			username: data.username,
			passwordHash,
			displayName: data.displayName,
		});

		const accessToken = generateToken({
			userId: user._id.toString(),
			email: user.email,
			username: user.username,
		});

		return {
			accessToken,
			user: {
				id: user._id.toString(),
				email: user.email,
				username: user.username,
				displayName: user.display_name,
				avatarUrl: user.avatar_url,
			},
		};
	},

	async login(data: LoginData): Promise<AuthResponse> {
		const user = await usersService.findByEmail(data.email);
		if (!user) {
			throw new AuthError("Invalid email or password", 401);
		}

		const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);
		if (!isPasswordValid) {
			throw new AuthError("Invalid email or password", 401);
		}

		const accessToken = generateToken({
			userId: user._id.toString(),
			email: user.email,
			username: user.username,
		});

		return {
			accessToken,
			user: {
				id: user._id.toString(),
				email: user.email,
				username: user.username,
				displayName: user.display_name,
				avatarUrl: user.avatar_url,
			},
		};
	},

	async getMe(userId: string): Promise<UserResponse> {
		const user = await usersService.findById(userId);
		if (!user) {
			throw new AuthError("User not found", 404);
		}

		return {
			id: user._id.toString(),
			email: user.email,
			username: user.username,
			displayName: user.display_name,
			avatarUrl: user.avatar_url,
		};
	},
};
