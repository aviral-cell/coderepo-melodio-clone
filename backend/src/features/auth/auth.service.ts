import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { usersService } from "../users/users.service.js";
import { User, AccountType, SubscriptionStatus } from "../users/user.model.js";

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
		accountType: AccountType;
		primaryAccountId: string | null;
		subscriptionStatus: SubscriptionStatus;
	};
}

export interface SwitchAccountResponse {
	token: string;
	user: {
		_id: string;
		email: string;
		displayName: string;
		accountType: AccountType;
		primaryAccountId: string | null;
		subscriptionStatus: SubscriptionStatus;
	};
}

export interface UserResponse {
	id: string;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	accountType: AccountType;
	primaryAccountId: string | null;
	subscriptionStatus: SubscriptionStatus;
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
				accountType: user.account_type,
				primaryAccountId: user.primary_account_id?.toString() || null,
				subscriptionStatus: user.subscription_status,
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
				accountType: user.account_type,
				primaryAccountId: user.primary_account_id?.toString() || null,
				subscriptionStatus: user.subscription_status,
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
			accountType: user.account_type,
			primaryAccountId: user.primary_account_id?.toString() || null,
			subscriptionStatus: user.subscription_status,
		};
	},

	async switchAccount(
		currentUserId: string,
		targetUserId: string,
	): Promise<SwitchAccountResponse> {
		const currentUser = await User.findById(currentUserId).exec();
		if (!currentUser) {
			throw new AuthError("Current user not found", 404);
		}

		const targetUser = await User.findById(targetUserId).exec();
		if (!targetUser) {
			throw new AuthError("Target user not found", 404);
		}

		const targetIsFamilyOfCurrent =
			targetUser.primary_account_id?.toString() === currentUserId;
		const currentIsFamilyOfTarget =
			currentUser.primary_account_id?.toString() === targetUserId;
		const targetIsSelf = currentUserId === targetUserId;

		if (!targetIsFamilyOfCurrent && !currentIsFamilyOfTarget && !targetIsSelf) {
			throw new AuthError("Not authorized to switch to this account", 403);
		}

		if (!targetUser.is_active) {
			throw new AuthError("Account is inactive", 403);
		}

		const token = generateToken({
			userId: targetUser._id.toString(),
			email: targetUser.email,
			username: targetUser.username,
		});

		return {
			token,
			user: {
				_id: targetUser._id.toString(),
				email: targetUser.email,
				displayName: targetUser.display_name,
				accountType: targetUser.account_type,
				primaryAccountId: targetUser.primary_account_id?.toString() || null,
				subscriptionStatus: targetUser.subscription_status,
			},
		};
	},
};
