/**
 * @jest-environment node
 */

import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";
import { User, AccountType } from "../../backend/src/features/users/user.model";

const config: Config = loadConfig(true);

const FAMILY_API_BASE = "/api/family";
const AUTH_API_BASE = "/api/auth";

let app: Application;

const primaryUserData = {
	email: "familytest-primary@melodio.com",
	username: "familytestprimary",
	password: "Password123!",
	displayName: "Family Test Primary User",
};

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@melodio.com`;
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

describe("Family Management", () => {
	beforeAll(async () => {
		await mongoose.connect(config.mongodbUri);

		app = createApp();
	});

	afterAll(async () => {
		await User.deleteMany({});
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		await User.deleteMany({});
	});

	describe("Adding Family Members", () => {
		let primaryToken: string;
		let primaryUserId: string;

		beforeEach(async () => {
			const uniquePrimaryUser = {
				...primaryUserData,
				email: generateUniqueEmail("primary"),
				username: `primary_${Date.now()}`,
			};
			const result = await registerAndLoginUser(uniquePrimaryUser);
			primaryToken = result.token;
			primaryUserId = result.userId;
		});

		it("should add family member", async () => {
			// Prepare family member data
			const familyMemberData = {
				name: "John Family Member",
				email: generateUniqueEmail("family-member"),
			};

			// Add family member via API
			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${primaryToken}`)
				.send(familyMemberData);

			// Verify member created
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveProperty("_id");
			expect(response.body.data.email).toBe(familyMemberData.email.toLowerCase());
			expect(response.body.data.displayName).toBe(familyMemberData.name);
			expect(response.body.data.accountType).toBe(AccountType.FAMILY_MEMBER);
			expect(response.body.data.primaryAccountId).toBe(primaryUserId);
			expect(response.body.data.isActive).toBe(true);
		});

		it("should appear in family members list after creation", async () => {
			// Add family member
			const familyMemberData = {
				name: "Test Family Member",
				email: generateUniqueEmail("family-member"),
			};

			const response = await request(app)
				.post(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${primaryToken}`)
				.send(familyMemberData);

			// Fetch family members list
			const getMembersResponse = await request(app)
				.get(FAMILY_API_BASE)
				.set("Authorization", `Bearer ${primaryToken}`);

			// Verify member appears in list
			expect(getMembersResponse.status).toBe(200);
			const member = getMembersResponse.body.data.familyMembers.find(
				(m: { _id: string }) => m._id === response.body.data._id,
			);
			expect(member).toBeDefined();
			expect(member.primaryAccountId).toBe(primaryUserId);
		});

	});

	describe("Account Switching", () => {
		let primaryToken: string;
		let primaryUserId: string;

		beforeEach(async () => {
			const uniquePrimaryUser = {
				...primaryUserData,
				email: generateUniqueEmail("primary"),
				username: `primary_${Date.now()}`,
			};
			const result = await registerAndLoginUser(uniquePrimaryUser);
			primaryToken = result.token;
			primaryUserId = result.userId;
		});

		it("should allow account switch for family member", async () => {
			// Add family member
			const { memberId } = await createFamilyMemberViaApi(primaryToken, {
				name: "Active Member",
				email: generateUniqueEmail("active-member"),
			});

			// Switch to family member account
			const switchResponse = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${primaryToken}`)
				.send({ targetUserId: memberId });

			// Verify switch returns new token
			expect(switchResponse.status).toBe(200);
			expect(switchResponse.body.success).toBe(true);
			expect(switchResponse.body.data.token).toBeDefined();
		});

		it("should return 403 when trying to switch to unrelated account", async () => {
			// Register an unrelated user
			const unrelatedUser = {
				email: generateUniqueEmail("unrelated"),
				username: `unrelated_${Date.now()}`,
				password: "Password123!",
				displayName: "Unrelated User",
			};
			const { userId: unrelatedUserId } = await registerAndLoginUser(unrelatedUser);

			// Attempt to switch to unrelated account
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${primaryToken}`)
				.send({ targetUserId: unrelatedUserId });

			// Verify forbidden response
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/not authorized/i);
		});

		it("should return 403 when family member tries to switch to another family member", async () => {
			// Create two family members
			const { memberId: memberAId } = await createFamilyMemberViaApi(primaryToken, {
				name: "Family Member A",
				email: generateUniqueEmail("switch-member-a"),
			});

			const { memberId: memberBId } = await createFamilyMemberViaApi(primaryToken, {
				name: "Family Member B",
				email: generateUniqueEmail("switch-member-b"),
			});

			// Switch to family member A
			const switchToARes = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${primaryToken}`)
				.send({ targetUserId: memberAId });

			const familyMemberAToken = switchToARes.body.data.token;

			// Attempt switch from member A to member B
			const response = await request(app)
				.post(`${AUTH_API_BASE}/switch`)
				.set("Authorization", `Bearer ${familyMemberAToken}`)
				.send({ targetUserId: memberBId });

			// Verify forbidden for member-to-member switch
			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/not authorized.*switch/i);
		});
	});
});
