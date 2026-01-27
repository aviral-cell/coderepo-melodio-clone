/**
 * @jest-environment node
 *
 * Task 5: Family Member Management & Account Switching
 *
 * This test suite covers behavioral tests for:
 * 1. Family Service - Add, remove, get family members
 * 2. Family Controller - API endpoints for family management
 * 3. Account Switch - Switch between primary and family member accounts
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose, { Schema, Document, Model } from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";

const config: Config = loadConfig(true);

const FAMILY_API_BASE = "/api/family";
const AUTH_API_BASE = "/api/auth";

// Account type enum matching the User model
enum AccountType {
	PRIMARY = "primary",
	FAMILY_MEMBER = "family_member",
}

// Subscription status enum
enum SubscriptionStatus {
	FREE = "free",
	PREMIUM = "premium",
}

// Subscription plan enum
enum SubscriptionPlan {
	FREE = "free",
	PREMIUM = "premium",
}

// User interface matching the model
interface IUser {
	email: string;
	username: string;
	password_hash: string;
	display_name: string;
	avatar_url?: string;
	account_type: AccountType;
	primary_account_id: mongoose.Types.ObjectId | null;
	is_active: boolean;
	subscription_status: SubscriptionStatus;
	created_at: Date;
	updated_at: Date;
}

interface IUserDocument extends IUser, Document {
	_id: mongoose.Types.ObjectId;
}

const userSchema = new Schema<IUserDocument>(
	{
		email: { type: String, required: true, unique: true, trim: true, lowercase: true },
		username: { type: String, required: true, unique: true, trim: true },
		password_hash: {
			type: String,
			required: function (this: IUserDocument) {
				return this.account_type === AccountType.PRIMARY;
			},
		},
		display_name: { type: String, required: true, trim: true },
		avatar_url: { type: String },
		account_type: {
			type: String,
			enum: Object.values(AccountType),
			default: AccountType.PRIMARY,
		},
		primary_account_id: {
			type: Schema.Types.ObjectId,
			ref: "User",
			default: null,
		},
		is_active: { type: Boolean, default: true },
		subscription_status: {
			type: String,
			enum: Object.values(SubscriptionStatus),
			default: SubscriptionStatus.FREE,
		},
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

// Subscription interface
interface ISubscription {
	user_id: mongoose.Types.ObjectId;
	plan: SubscriptionPlan;
	start_date: Date;
	end_date: Date | null;
	auto_renew: boolean;
	created_at: Date;
	updated_at: Date;
}

interface ISubscriptionDocument extends ISubscription, Document {
	_id: mongoose.Types.ObjectId;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>(
	{
		user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
		plan: {
			type: String,
			enum: Object.values(SubscriptionPlan),
			default: SubscriptionPlan.FREE,
			required: true,
		},
		start_date: { type: Date, required: true },
		end_date: { type: Date, default: null },
		auto_renew: { type: Boolean, default: false },
	},
	{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

let User: Model<IUserDocument>;
let Subscription: Model<ISubscriptionDocument>;
let app: Application;

// Test user credentials
const primaryUserData = {
	email: "familytest-primary@hackerrank.com",
	username: "familytestprimary",
	password: "Password123!",
	displayName: "Family Test Primary User",
};

const freeUserData = {
	email: "familytest-free@hackerrank.com",
	username: "familytestfree",
	password: "Password123!",
	displayName: "Family Test Free User",
};

// Helper to generate unique test emails
function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@hackerrank.com`;
}

// Helper to register and login a user, returning the auth token
async function registerAndLoginUser(
	userData: typeof primaryUserData,
): Promise<{ token: string; userId: string }> {
	await request(app).post(`${AUTH_API_BASE}/register`).send(userData);

	const loginRes = await request(app).post(`${AUTH_API_BASE}/login`).send({
		email: userData.email,
		password: userData.password,
	});

	return {
		token: loginRes.body.data.accessToken,
		userId: loginRes.body.data.user.id,
	};
}

// Helper to upgrade a user to premium subscription
async function upgradeToPremium(userId: string): Promise<void> {
	const userObjectId = new mongoose.Types.ObjectId(userId);
	const oneMonthFromNow = new Date();
	oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

	await Subscription.findOneAndUpdate(
		{ user_id: userObjectId },
		{
			plan: SubscriptionPlan.PREMIUM,
			start_date: new Date(),
			end_date: oneMonthFromNow,
			auto_renew: true,
		},
		{ upsert: true, new: true },
	);

	await User.findByIdAndUpdate(userObjectId, {
		subscription_status: SubscriptionStatus.PREMIUM,
	});
}

// Helper to create a family member directly in the database
async function createFamilyMemberDirectly(
	primaryUserId: string,
	memberData: { email: string; name: string },
): Promise<IUserDocument> {
	const primaryUserObjectId = new mongoose.Types.ObjectId(primaryUserId);
	const primaryUser = await User.findById(primaryUserObjectId);

	const familyMember = await User.create({
		email: memberData.email.toLowerCase(),
		username: `${memberData.name.toLowerCase().replace(/\s+/g, "")}_${Date.now()}`,
		password_hash: "",
		display_name: memberData.name,
		account_type: AccountType.FAMILY_MEMBER,
		primary_account_id: primaryUserObjectId,
		is_active: true,
		subscription_status: primaryUser?.subscription_status || SubscriptionStatus.FREE,
	});

	return familyMember;
}

describe("Task 5: Family Member Management & Account Switching", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		User = mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
		Subscription =
			mongoose.models.Subscription ||
			mongoose.model<ISubscriptionDocument>("Subscription", subscriptionSchema);

		app = createApp();
	});

	afterAll(async () => {
		await User.deleteMany({});
		await Subscription.deleteMany({});
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await User.deleteMany({});
		await Subscription.deleteMany({});
	});

	describe("Family Service - Add Family Member", () => {
		let premiumToken: string;
		let premiumUserId: string;

		beforeEach(async () => {
			const uniquePrimaryUser = {
				...primaryUserData,
				email: generateUniqueEmail("premium-primary"),
				username: `premiumprimary_${Date.now()}`,
			};
			const result = await registerAndLoginUser(uniquePrimaryUser);
			premiumToken = result.token;
			premiumUserId = result.userId;
			await upgradeToPremium(premiumUserId);
		});

		it("should add a family member successfully when user has premium subscription", async () => {
			// Arrange
			const familyMemberData = {
				name: "John Family Member",
				email: generateUniqueEmail("family-member"),
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(familyMemberData);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveProperty("_id");
			expect(response.body.data.email).toBe(familyMemberData.email.toLowerCase());
			expect(response.body.data.displayName).toBe(familyMemberData.name);
			expect(response.body.data.accountType).toBe(AccountType.FAMILY_MEMBER);
			expect(response.body.data.primaryAccountId).toBe(premiumUserId);
			expect(response.body.data.isActive).toBe(true);
		});

		describe("Scenario 2.1.4: Free user can add family member", () => {
			it("Given: User has free subscription, When: POST /family, Then: Returns 201 Created", async () => {
				// Arrange - Create a free user
				const freeUser = {
					...freeUserData,
					email: generateUniqueEmail("free-user"),
					username: `freeuser_${Date.now()}`,
				};
				const { token: freeToken, userId: freeUserId } = await registerAndLoginUser(freeUser);

				const familyMemberData = {
					name: "Test Family Member",
					email: generateUniqueEmail("family-member"),
				};

				// Act
				const response = await request(app)
					.post(FAMILY_API_BASE)
					.set("Authorization", `Bearer ${freeToken}`)
					.send(familyMemberData);

				// Assert - Free user should successfully add family member
				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data).toHaveProperty("_id");
				expect(response.body.data.email).toBe(familyMemberData.email.toLowerCase());
				expect(response.body.data.displayName).toBe(familyMemberData.name);
				expect(response.body.data.accountType).toBe(AccountType.FAMILY_MEMBER);
				expect(response.body.data.primaryAccountId).toBe(freeUserId);
				expect(response.body.data.isActive).toBe(true);
				// Family member should inherit "free" status from primary
				expect(response.body.data.subscriptionStatus).toBe(SubscriptionStatus.FREE);

				// Verify in database
				const dbMember = await User.findById(response.body.data._id);
				expect(dbMember?.subscription_status).toBe(SubscriptionStatus.FREE);
				expect(dbMember?.primary_account_id?.toString()).toBe(freeUserId);
			});
		});

		it("should return 400 when maximum family members limit (3) is reached", async () => {
			// Arrange - Add 3 family members first
			for (let i = 0; i < 3; i++) {
				await createFamilyMemberDirectly(premiumUserId, {
					name: `Family Member ${i + 1}`,
					email: generateUniqueEmail(`existing-member-${i}`),
				});
			}

			const newMemberData = {
				name: "Fourth Family Member",
				email: generateUniqueEmail("fourth-member"),
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(newMemberData);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("Maximum");
		});

		it("should return 409 when email is already registered", async () => {
			// Arrange - Create a family member with specific email
			const existingEmail = generateUniqueEmail("existing");
			await createFamilyMemberDirectly(premiumUserId, {
				name: "Existing Member",
				email: existingEmail,
			});

			const duplicateMemberData = {
				name: "Duplicate Member",
				email: existingEmail,
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(duplicateMemberData);

			// Assert
			expect(response.status).toBe(409);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("already registered");
		});

		it("should return 400 when name is missing", async () => {
			// Arrange
			const invalidData = {
				email: generateUniqueEmail("missing-name"),
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(invalidData);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 when email is missing", async () => {
			// Arrange
			const invalidData = {
				name: "Test Member",
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(invalidData);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 when email format is invalid", async () => {
			// Arrange
			const invalidData = {
				name: "Test Member",
				email: "invalid-email-format",
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(invalidData);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 when name is too short", async () => {
			// Arrange
			const invalidData = {
				name: "A",
				email: generateUniqueEmail("short-name"),
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(invalidData);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should create family member with inherited premium subscription status", async () => {
			// Arrange
			const familyMemberData = {
				name: "Premium Inheritor",
				email: generateUniqueEmail("premium-inheritor"),
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(familyMemberData);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.subscriptionStatus).toBe(SubscriptionStatus.PREMIUM);
			expect(response.body.data.primaryAccountId).toBe(premiumUserId);

			// Verify in database
			const dbMember = await User.findById(response.body.data._id);
			expect(dbMember?.subscription_status).toBe(SubscriptionStatus.PREMIUM);
			expect(dbMember?.primary_account_id?.toString()).toBe(premiumUserId);
		});

		it("should create family member with isActive set to true", async () => {
			// Arrange
			const familyMemberData = {
				name: "Active Member",
				email: generateUniqueEmail("active-member"),
			};

			// Act
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send(familyMemberData);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data.isActive).toBe(true);

			// Verify the family member can immediately be switched to
			const switchResponse = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: response.body.data._id });

			expect(switchResponse.status).toBe(200);
			expect(switchResponse.body.success).toBe(true);
			expect(switchResponse.body.data.token).toBeDefined();
		});
	});

	describe("Family Service - Get Family Members", () => {
		let premiumToken: string;
		let premiumUserId: string;

		beforeEach(async () => {
			const uniquePrimaryUser = {
				...primaryUserData,
				email: generateUniqueEmail("premium-primary"),
				username: `premiumprimary_${Date.now()}`,
			};
			const result = await registerAndLoginUser(uniquePrimaryUser);
			premiumToken = result.token;
			premiumUserId = result.userId;
			await upgradeToPremium(premiumUserId);
		});

		it("should return all active family members for a primary account", async () => {
			// Arrange - Add 2 family members
			await createFamilyMemberDirectly(premiumUserId, {
				name: "Family Member One",
				email: generateUniqueEmail("member-one"),
			});
			await createFamilyMemberDirectly(premiumUserId, {
				name: "Family Member Two",
				email: generateUniqueEmail("member-two"),
			});

			// Act
			const response = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.familyMembers).toHaveLength(2);
			expect(response.body.data.maxMembers).toBe(3);
			expect(response.body.data.remainingSlots).toBe(1);
		});

		it("should return empty array when no family members exist", async () => {
			// Act
			const response = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.familyMembers).toHaveLength(0);
			expect(response.body.data.maxMembers).toBe(3);
			expect(response.body.data.remainingSlots).toBe(3);
		});

		it("should not include inactive (soft-deleted) family members", async () => {
			// Arrange - Create an active and an inactive member
			await createFamilyMemberDirectly(premiumUserId, {
				name: "Active Member",
				email: generateUniqueEmail("active-member"),
			});

			const inactiveMember = await createFamilyMemberDirectly(premiumUserId, {
				name: "Inactive Member",
				email: generateUniqueEmail("inactive-member"),
			});

			// Soft delete the inactive member
			await User.findByIdAndUpdate(inactiveMember._id, { is_active: false });

			// Act
			const response = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${premiumToken}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.familyMembers).toHaveLength(1);
			expect(response.body.data.familyMembers[0].displayName).toBe("Active Member");
		});
	});

	describe("Family Service - Remove Family Member", () => {
		let premiumToken: string;
		let premiumUserId: string;

		beforeEach(async () => {
			const uniquePrimaryUser = {
				...primaryUserData,
				email: generateUniqueEmail("premium-primary"),
				username: `premiumprimary_${Date.now()}`,
			};
			const result = await registerAndLoginUser(uniquePrimaryUser);
			premiumToken = result.token;
			premiumUserId = result.userId;
			await upgradeToPremium(premiumUserId);
		});

		it("should soft delete a family member successfully", async () => {
			// Arrange
			const familyMember = await createFamilyMemberDirectly(premiumUserId, {
				name: "Member To Remove",
				email: generateUniqueEmail("remove-member"),
			});

			// Act
			const response = await request(app)
				.delete(`${FAMILY_API_BASE}/${familyMember._id}`)
				.set("Authorization", `Bearer ${premiumToken}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.message).toContain("removed");

			// Verify hard delete in database
			const deletedMember = await User.findById(familyMember._id);
			expect(deletedMember).toBeNull();
		});

		it("should return 404 when family member does not exist", async () => {
			// Arrange
			const nonExistentId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.delete(`${FAMILY_API_BASE}/${nonExistentId}`)
				.set("Authorization", `Bearer ${premiumToken}`);

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		it("should return 403 when trying to remove another user's family member", async () => {
			// Arrange - Create another premium user with a family member
			const anotherUser = {
				email: generateUniqueEmail("another-premium"),
				username: `anotherpremium_${Date.now()}`,
				password: "Password123!",
				displayName: "Another Premium User",
			};
			const { userId: anotherUserId } = await registerAndLoginUser(anotherUser);
			await upgradeToPremium(anotherUserId);

			const otherFamilyMember = await createFamilyMemberDirectly(anotherUserId, {
				name: "Other Member",
				email: generateUniqueEmail("other-member"),
			});

			// Act - Try to remove another user's family member
			const response = await request(app)
				.delete(`${FAMILY_API_BASE}/${otherFamilyMember._id}`)
				.set("Authorization", `Bearer ${premiumToken}`);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 for invalid member ID format", async () => {
			// Act
			const response = await request(app)
				.delete(`${FAMILY_API_BASE}/invalid-id-format`)
				.set("Authorization", `Bearer ${premiumToken}`);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 403 when family member tries to delete another family member", async () => {
			// Arrange - Create two family members
			const familyMemberA = await createFamilyMemberDirectly(premiumUserId, {
				name: "Family Member A",
				email: generateUniqueEmail("member-a"),
			});

			const familyMemberB = await createFamilyMemberDirectly(premiumUserId, {
				name: "Family Member B",
				email: generateUniqueEmail("member-b"),
			});

			// Get token for family member A by switching from primary
			const switchRes = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: familyMemberA._id.toString() });

			const familyMemberAToken = switchRes.body.data.token;

			// Act - Family member A tries to delete family member B
			const response = await request(app)
				.delete(`${FAMILY_API_BASE}/${familyMemberB._id}`)
				.set("Authorization", `Bearer ${familyMemberAToken}`);

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("Not authorized");
		});
	});

	describe("Family Controller - Authentication", () => {
		it("should return 401 when accessing family endpoints without token", async () => {
			// Act - GET
			const getResponse = await request(app).get(FAMILY_API_BASE);

			// Assert
			expect(getResponse.status).toBe(401);

			// Act - POST
			const postResponse = await request(app).post(FAMILY_API_BASE).send({
				name: "Test",
				email: "test@example.com",
			});

			// Assert
			expect(postResponse.status).toBe(401);

			// Act - DELETE
			const deleteResponse = await request(app).delete(
				`${FAMILY_API_BASE}/${new mongoose.Types.ObjectId()}`,
			);

			// Assert
			expect(deleteResponse.status).toBe(401);
		});

		it("should return 401 when accessing family endpoints with invalid token", async () => {
			// Act
			const response = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", "Bearer invalid-token-here");

			// Assert
			expect(response.status).toBe(401);
		});
	});

	describe("Account Switch - POST /api/auth/switch", () => {
		let premiumToken: string;
		let premiumUserId: string;

		beforeEach(async () => {
			const uniquePrimaryUser = {
				...primaryUserData,
				email: generateUniqueEmail("premium-primary"),
				username: `premiumprimary_${Date.now()}`,
			};
			const result = await registerAndLoginUser(uniquePrimaryUser);
			premiumToken = result.token;
			premiumUserId = result.userId;
			await upgradeToPremium(premiumUserId);
		});

		it("should allow primary user to switch to family member account", async () => {
			// Arrange
			const familyMember = await createFamilyMemberDirectly(premiumUserId, {
				name: "Switchable Member",
				email: generateUniqueEmail("switch-member"),
			});

			// Act
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: familyMember._id.toString() });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.token).toBeDefined();
			expect(response.body.data.user._id).toBe(familyMember._id.toString());
			expect(response.body.data.user.accountType).toBe(AccountType.FAMILY_MEMBER);
		});

		it("should allow family member to switch back to primary account", async () => {
			// Arrange - Create family member and get their token via switch
			const familyMember = await createFamilyMemberDirectly(premiumUserId, {
				name: "Switchable Member",
				email: generateUniqueEmail("switch-member"),
			});

			const switchToFamilyRes = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: familyMember._id.toString() });

			const familyMemberToken = switchToFamilyRes.body.data.token;

			// Act - Switch back to primary
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${familyMemberToken}`)
				.send({ targetUserId: premiumUserId });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.token).toBeDefined();
			expect(response.body.data.user._id).toBe(premiumUserId);
			expect(response.body.data.user.accountType).toBe(AccountType.PRIMARY);
		});

		it("should return 403 when trying to switch to unrelated account", async () => {
			// Arrange - Create another unrelated user
			const unrelatedUser = {
				email: generateUniqueEmail("unrelated"),
				username: `unrelated_${Date.now()}`,
				password: "Password123!",
				displayName: "Unrelated User",
			};
			const { userId: unrelatedUserId } = await registerAndLoginUser(unrelatedUser);

			// Act
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: unrelatedUserId });

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("Not authorized");
		});

		it("should return 403 when family member tries to switch to another family member", async () => {
			// Arrange - Create two family members under the same primary
			const familyMemberA = await createFamilyMemberDirectly(premiumUserId, {
				name: "Family Member A",
				email: generateUniqueEmail("switch-member-a"),
			});

			const familyMemberB = await createFamilyMemberDirectly(premiumUserId, {
				name: "Family Member B",
				email: generateUniqueEmail("switch-member-b"),
			});

			// Get token for family member A by switching from primary
			const switchToARes = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: familyMemberA._id.toString() });

			const familyMemberAToken = switchToARes.body.data.token;

			// Act - Family member A tries to switch to family member B
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${familyMemberAToken}`)
				.send({ targetUserId: familyMemberB._id.toString() });

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("Not authorized to switch to this account");
		});

		it("should return 404 when target user does not exist", async () => {
			// Arrange
			const nonExistentId = new mongoose.Types.ObjectId();

			// Act
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: nonExistentId.toString() });

			// Assert
			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		it("should return 403 when target account is inactive", async () => {
			// Arrange - Create and deactivate family member
			const familyMember = await createFamilyMemberDirectly(premiumUserId, {
				name: "Inactive Member",
				email: generateUniqueEmail("inactive-member"),
			});

			await User.findByIdAndUpdate(familyMember._id, { is_active: false });

			// Act
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: familyMember._id.toString() });

			// Assert
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("inactive");
		});

		it("should return 400 when targetUserId is missing", async () => {
			// Act
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({});

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should return 400 when targetUserId is invalid", async () => {
			// Act
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: "invalid-object-id" });

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		it("should allow switching to self (same user)", async () => {
			// Act
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${premiumToken}`)
				.send({ targetUserId: premiumUserId });

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.user._id).toBe(premiumUserId);
		});

		it("should return 401 when not authenticated", async () => {
			// Act
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.send({ targetUserId: premiumUserId });

			// Assert
			expect(response.status).toBe(401);
		});
	});

	describe("Auth Middleware - Active Status Check", () => {
		let activeToken: string;
		let activeUserId: string;

		beforeEach(async () => {
			const uniqueActiveUser = {
				...primaryUserData,
				email: generateUniqueEmail("active-user"),
				username: `activeuser_${Date.now()}`,
			};
			const result = await registerAndLoginUser(uniqueActiveUser);
			activeToken = result.token;
			activeUserId = result.userId;
		});

		it("should allow active user to access authenticated endpoints", async () => {
			// Arrange - User is already active by default

			// Act - Call any authenticated endpoint (GET /api/family)
			const response = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${activeToken}`);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
		});

		it("should return 401 when inactive user makes API request", async () => {
			// Arrange - Deactivate the user
			await User.findByIdAndUpdate(activeUserId, { is_active: false });

			// Act - Try to access authenticated endpoint with token obtained before deactivation
			const response = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${activeToken}`);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("Account inactive");
		});

		it("should return 401 when token is from a deleted user", async () => {
			// Arrange - Delete the user from the database
			await User.findByIdAndDelete(activeUserId);

			// Act - Try to access authenticated endpoint with token from deleted user
			const response = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${activeToken}`);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toContain("User not found");
		});

		it("should terminate session when user is deactivated mid-session", async () => {
			// Arrange - First verify the user can make requests
			const initialResponse = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${activeToken}`);

			expect(initialResponse.status).toBe(200);

			// Simulate admin deactivating the user mid-session
			await User.findByIdAndUpdate(activeUserId, { is_active: false });

			// Act - User's next API request after deactivation
			const subsequentResponse = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${activeToken}`);

			// Assert
			expect(subsequentResponse.status).toBe(401);
			expect(subsequentResponse.body.success).toBe(false);
			expect(subsequentResponse.body.error).toContain("Account inactive");
		});
	});
});
