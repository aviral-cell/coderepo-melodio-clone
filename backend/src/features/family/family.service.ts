import mongoose from "mongoose";
import { User, IUserDocument, AccountType, SubscriptionStatus } from "../users/user.model.js";
import { FamilyMemberDto } from "./family.dto.js";

export class FamilyError extends Error {
	statusCode: number;

	constructor(message: string, statusCode: number) {
		super(message);
		this.statusCode = statusCode;
		this.name = "FamilyError";
	}
}

export interface FamilyMemberResponse {
	_id: string;
	email: string;
	displayName: string;
	username: string;
	accountType: AccountType;
	primaryAccountId: string;
	isActive: boolean;
	subscriptionStatus: SubscriptionStatus;
	createdAt: string;
}

function transformFamilyMember(user: IUserDocument): FamilyMemberResponse {
	return {
		_id: user._id.toString(),
		email: user.email,
		displayName: user.display_name,
		username: user.username,
		accountType: user.account_type,
		primaryAccountId: user.primary_account_id?.toString() || "",
		isActive: user.is_active,
		subscriptionStatus: user.subscription_status,
		createdAt: user.created_at.toISOString(),
	};
}

function generateUsername(name: string): string {
	const baseName = name.toLowerCase().replace(/\s+/g, "");
	const randomSuffix = Math.random().toString(36).substring(2, 8);
	return `${baseName}_${randomSuffix}`;
}

export const familyService = {
	async addFamilyMember(
		primaryUserId: string,
		memberData: FamilyMemberDto,
	): Promise<FamilyMemberResponse> {
		const primaryUserObjectId = new mongoose.Types.ObjectId(primaryUserId);

		const primaryUser = await User.findById(primaryUserObjectId).exec();
		if (!primaryUser) {
			throw new FamilyError("Primary user not found", 404);
		}

		if (primaryUser.account_type === AccountType.FAMILY_MEMBER) {
			throw new FamilyError("Only primary account can manage family", 403);
		}

		const existingMembersCount = await User.countDocuments({
			primary_account_id: primaryUserObjectId,
			is_active: true,
		}).exec();

		if (existingMembersCount >= 3) {
			throw new FamilyError("Maximum 3 family members allowed", 400);
		}

		const existingEmail = await User.findOne({
			email: memberData.email.toLowerCase(),
		}).exec();

		if (existingEmail) {
			throw new FamilyError("Email already registered", 409);
		}

		let username = generateUsername(memberData.name);
		let attempts = 0;
		while (await User.findOne({ username }).exec()) {
			username = generateUsername(memberData.name);
			attempts++;
			if (attempts > 10) {
				throw new FamilyError("Failed to generate unique username", 500);
			}
		}

		const familyMember = await User.create({
			email: memberData.email.toLowerCase(),
			username,
			password_hash: "",
			display_name: memberData.name,
			account_type: AccountType.FAMILY_MEMBER,
			primary_account_id: primaryUserObjectId,
			is_active: true,
			subscription_status: primaryUser.subscription_status,
		});

		return transformFamilyMember(familyMember);
	},

	async getFamilyMembers(userId: string): Promise<{
		familyMembers: FamilyMemberResponse[];
		maxMembers: number;
		remainingSlots: number;
	}> {
		const userObjectId = new mongoose.Types.ObjectId(userId);

		const user = await User.findById(userObjectId).exec();
		if (!user) {
			throw new FamilyError("User not found", 404);
		}

		const primaryAccountId =
			user.account_type === AccountType.FAMILY_MEMBER && user.primary_account_id
				? user.primary_account_id
				: userObjectId;

		const familyMembers = await User.find({
			primary_account_id: primaryAccountId,
			is_active: true,
		})
			.sort({ created_at: -1 })
			.exec();

		const transformedMembers = familyMembers.map(transformFamilyMember);
		const maxMembers = 3;

		return {
			familyMembers: transformedMembers,
			maxMembers,
			remainingSlots: maxMembers - transformedMembers.length,
		};
	},

	async removeFamilyMember(
		primaryUserId: string,
		memberId: string,
	): Promise<boolean> {
		const primaryUserObjectId = new mongoose.Types.ObjectId(primaryUserId);
		const memberObjectId = new mongoose.Types.ObjectId(memberId);

		const primaryUser = await User.findById(primaryUserObjectId).exec();
		if (!primaryUser) {
			throw new FamilyError("User not found", 404);
		}

		if (primaryUser.account_type === AccountType.FAMILY_MEMBER) {
			throw new FamilyError("Not authorized to manage family members", 403);
		}

		const member = await User.findById(memberObjectId).exec();

		if (!member) {
			throw new FamilyError("Family member not found", 404);
		}

		if (!member.primary_account_id?.equals(primaryUserObjectId)) {
			throw new FamilyError("Not authorized to remove this family member", 403);
		}

		await User.findByIdAndDelete(memberObjectId).exec();

		return true;
	},
};
