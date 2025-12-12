import { User, IUserDocument } from "./user.model.js";

export interface CreateUserData {
	email: string;
	username: string;
	passwordHash: string;
	displayName: string;
	avatarUrl?: string;
}

export const usersService = {
	async findByEmail(email: string): Promise<IUserDocument | null> {
		return User.findOne({ email: email.toLowerCase() })
			.select("+password_hash")
			.exec();
	},

	async findByUsername(username: string): Promise<IUserDocument | null> {
		return User.findOne({ username }).exec();
	},

	async findById(id: string): Promise<IUserDocument | null> {
		return User.findById(id).exec();
	},

	async create(data: CreateUserData): Promise<IUserDocument> {
		const user = new User({
			email: data.email.toLowerCase(),
			username: data.username,
			password_hash: data.passwordHash,
			display_name: data.displayName,
			avatar_url: data.avatarUrl,
		});
		return user.save();
	},
};
