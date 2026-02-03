/**
 * @jest-environment node
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
const PAYMENT_API_BASE = "/api/payment";

enum AccountType {
	PRIMARY = "primary",
	FAMILY_MEMBER = "family_member",
}

enum SubscriptionStatus {
	FREE = "free",
	PREMIUM = "premium",
}

enum SubscriptionPlan {
	FREE = "free",
	PREMIUM = "premium",
}

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

const primaryUserData = {
	email: "familytest-primary@hackerrank.com",
	username: "familytestprimary",
	password: "Password123!",
	displayName: "Family Test Primary User",
};

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@hackerrank.com`;
}

function generateIdempotencyKey(): string {
	return `idem-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

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

async function upgradeToPremiumViaApi(token: string): Promise<void> {
	await request(app)
		.post(`${PAYMENT_API_BASE}/card`)
		.set("Authorization", `Bearer ${token}`)
		.set("Idempotency-Key", generateIdempotencyKey())
		.send({
			subscriptionPrice: 999,
			cardDetails: {
				cardNumber: "4111111111111111",
				expiryMonth: "12",
				expiryYear: "30",
				cvv: "123",
			},
		});
}

async function createFamilyMemberViaApi(
	token: string,
	memberData: { email: string; name: string },
): Promise<{ memberId: string; memberData: Record<string, unknown> }> {
	const response = await request(app)
		.post(FAMILY_API_BASE)
		.set("Authorization", `Bearer ${token}`)
		.send(memberData);

	return {
		memberId: response.body.data._id,
		memberData: response.body.data,
	};
}

describe("Family Management API", () => {
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

	describe("POST /api/family", () => {
		describe("Success Cases", () => {
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
				await upgradeToPremiumViaApi(premiumToken);
			});

			it("should add family member successfully when user has premium subscription", async () => {
				const familyMemberData = {
					name: "John Family Member",
					email: generateUniqueEmail("family-member"),
				};

				const response = await request(app)
					.post(FAMILY_API_BASE)
					.set("Authorization", `Bearer ${premiumToken}`)
					.send(familyMemberData);

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data).toHaveProperty("_id");
				expect(response.body.data.email).toBe(familyMemberData.email.toLowerCase());
				expect(response.body.data.displayName).toBe(familyMemberData.name);
				expect(response.body.data.accountType).toBe(AccountType.FAMILY_MEMBER);
				expect(response.body.data.primaryAccountId).toBe(premiumUserId);
				expect(response.body.data.isActive).toBe(true);
			});

			it("should create family member with isActive set to true", async () => {
				const familyMemberData = {
					name: "Active Member",
					email: generateUniqueEmail("active-member"),
				};

				const response = await request(app)
					.post(FAMILY_API_BASE)
					.set("Authorization", `Bearer ${premiumToken}`)
					.send(familyMemberData);

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data.isActive).toBe(true);

				const switchResponse = await request(app)
					.post(`${AUTH_API_BASE}/switch`)
					.set("Authorization", `Bearer ${premiumToken}`)
					.send({ targetUserId: response.body.data._id });

				expect(switchResponse.status).toBe(200);
				expect(switchResponse.body.success).toBe(true);
				expect(switchResponse.body.data.token).toBeDefined();
			});

			it("should allow free user to add family member", async () => {
				const freeUser = {
					email: generateUniqueEmail("free-user"),
					username: `freeuser_${Date.now()}`,
					password: "Password123!",
					displayName: "Free Test User",
				};
				const { token: freeToken, userId: freeUserId } = await registerAndLoginUser(freeUser);

				const familyMemberData = {
					name: "Test Family Member",
					email: generateUniqueEmail("family-member"),
				};

				const response = await request(app)
					.post(FAMILY_API_BASE)
					.set("Authorization", `Bearer ${freeToken}`)
					.send(familyMemberData);

				expect(response.status).toBe(201);
				expect(response.body.success).toBe(true);
				expect(response.body.data).toHaveProperty("_id");
				expect(response.body.data.email).toBe(familyMemberData.email.toLowerCase());
				expect(response.body.data.displayName).toBe(familyMemberData.name);
				expect(response.body.data.accountType).toBe(AccountType.FAMILY_MEMBER);
				expect(response.body.data.primaryAccountId).toBe(freeUserId);
				expect(response.body.data.isActive).toBe(true);
				expect(response.body.data.subscriptionStatus).toBe(SubscriptionStatus.FREE);

				const getMembersResponse = await request(app)
					.get(FAMILY_API_BASE)
					.set("Authorization", `Bearer ${freeToken}`);

				expect(getMembersResponse.status).toBe(200);
				const member = getMembersResponse.body.data.familyMembers.find(
					(m: { _id: string }) => m._id === response.body.data._id,
				);
				expect(member).toBeDefined();
				expect(member.subscriptionStatus).toBe(SubscriptionStatus.FREE);
				expect(member.primaryAccountId).toBe(freeUserId);
			});
		});
	});

	describe("POST /api/auth/switch", () => {
		describe("Authorization", () => {
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
				await upgradeToPremiumViaApi(premiumToken);
			});

			it("should return 403 when trying to switch to unrelated account", async () => {
				const unrelatedUser = {
					email: generateUniqueEmail("unrelated"),
					username: `unrelated_${Date.now()}`,
					password: "Password123!",
					displayName: "Unrelated User",
				};
				const { userId: unrelatedUserId } = await registerAndLoginUser(unrelatedUser);

				const response = await request(app)
					.post(`${AUTH_API_BASE}/switch`)
					.set("Authorization", `Bearer ${premiumToken}`)
					.send({ targetUserId: unrelatedUserId });

				expect(response.status).toBe(403);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/not authorized/i);
			});

			it("should return 403 when family member tries to switch to another family member", async () => {
				const { memberId: memberAId } = await createFamilyMemberViaApi(premiumToken, {
					name: "Family Member A",
					email: generateUniqueEmail("switch-member-a"),
				});

				const { memberId: memberBId } = await createFamilyMemberViaApi(premiumToken, {
					name: "Family Member B",
					email: generateUniqueEmail("switch-member-b"),
				});

				const switchToARes = await request(app)
					.post(`${AUTH_API_BASE}/switch`)
					.set("Authorization", `Bearer ${premiumToken}`)
					.send({ targetUserId: memberAId });

				const familyMemberAToken = switchToARes.body.data.token;

				const response = await request(app)
					.post(`${AUTH_API_BASE}/switch`)
					.set("Authorization", `Bearer ${familyMemberAToken}`)
					.send({ targetUserId: memberBId });

				expect(response.status).toBe(403);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/not authorized.*switch/i);
			});
		});
	});

	describe("Auth Middleware", () => {
		describe("Active Status Check", () => {
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

			it("should return 401 when inactive user makes API request", async () => {
				await User.findByIdAndUpdate(activeUserId, { is_active: false });

				const response = await request(app)
					.get(FAMILY_API_BASE)
					.set("Authorization", `Bearer ${activeToken}`);

				expect(response.status).toBe(401);
				expect(response.body.success).toBe(false);
				expect(response.body.error).toMatch(/account.*inactive/i);
			});

			it("should terminate session when user is deactivated mid-session", async () => {
				const initialResponse = await request(app)
					.get(FAMILY_API_BASE)
					.set("Authorization", `Bearer ${activeToken}`);

				expect(initialResponse.status).toBe(200);

				await User.findByIdAndUpdate(activeUserId, { is_active: false });

				const subsequentResponse = await request(app)
					.get(FAMILY_API_BASE)
					.set("Authorization", `Bearer ${activeToken}`);

				expect(subsequentResponse.status).toBe(401);
				expect(subsequentResponse.body.success).toBe(false);
				expect(subsequentResponse.body.error).toMatch(/account.*inactive/i);
			});
		});
	});
});
