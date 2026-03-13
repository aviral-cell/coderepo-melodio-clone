import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../backend/.env") });

import request from "supertest";
import mongoose from "mongoose";
import { Application } from "express";
import { createApp } from "../../backend/src/app";
import { loadConfig, Config } from "../../backend/src/shared/config";
import { User, SubscriptionStatus } from "../../backend/src/features/users/user.model";
import { Subscription } from "../../backend/src/features/subscription/subscription.model";
import { SubscriptionPlan } from "../../backend/src/features/subscription/subscription.types";
import { Payment } from "../../backend/src/features/payment/payment.model";
import { PaymentStatus } from "../../backend/src/features/payment/payment.types";
import { Playlist } from "../../backend/src/features/playlists/playlist.model";
import { FREE_PLAYLIST_LIMIT } from "../../backend/src/features/subscription/subscription.types";

const config: Config = loadConfig(true);

const AUTH_BASE = "/api/auth";
const PAYMENT_BASE = "/api/payment";
const SUBSCRIPTION_BASE = "/api/subscription";
const PLAYLIST_BASE = "/api/playlists";

let app: Application;

function generateUniqueEmail(prefix: string): string {
	return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@melodio.com`;
}

function createValidCardDetails(): {
	cardNumber: string;
	expiryMonth: string;
	expiryYear: string;
	cvv: string;
} {
	const currentDate = new Date();
	const futureYear = ((currentDate.getUTCFullYear() % 100) + 2).toString().padStart(2, "0");

	return {
		cardNumber: "4111111111111111",
		expiryMonth: "12",
		expiryYear: futureYear,
		cvv: "123",
	};
}

function createExpiredCardDetails(): {
	cardNumber: string;
	expiryMonth: string;
	expiryYear: string;
	cvv: string;
} {
	const currentDate = new Date();
	const pastYear = ((currentDate.getUTCFullYear() % 100) - 1).toString().padStart(2, "0");

	return {
		cardNumber: "4111111111111111",
		expiryMonth: "01",
		expiryYear: pastYear,
		cvv: "123",
	};
}

function createValidPaymentRequest(
	subscriptionPrice = 9.99,
): { subscriptionPrice: number; cardDetails: ReturnType<typeof createValidCardDetails> } {
	return {
		subscriptionPrice,
		cardDetails: createValidCardDetails(),
	};
}

async function createTestUser(
	appInstance: Application,
	email: string,
	password: string,
): Promise<{ token: string; userId: string }> {
	const username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
	const displayName = username.charAt(0).toUpperCase() + username.slice(1);

	await request(appInstance).post(`${AUTH_BASE}/register`).send({
		email,
		username,
		password,
		displayName,
	});

	const loginRes = await request(appInstance).post(`${AUTH_BASE}/login`).send({
		email,
		password,
	});

	const token = loginRes.body.data.accessToken;

	const meRes = await request(appInstance)
		.get(`${AUTH_BASE}/me`)
		.set("Authorization", `Bearer ${token}`);

	return {
		token,
		userId: meRes.body.data._id,
	};
}

beforeAll(async () => {
	await mongoose.connect(config.mongodbUri);

	app = createApp();
});

afterAll(async () => {
	await User.deleteMany({ email: { $regex: /subscription/i } });
	await Subscription.deleteMany({});
	await Payment.deleteMany({});
	await Playlist.deleteMany({});
	await mongoose.disconnect();
});

beforeEach(async () => {
	await User.deleteMany({ email: { $regex: /subscription/i } });
	await Subscription.deleteMany({});
	await Payment.deleteMany({});
	await Playlist.deleteMany({});
});

describe("Card Payment Processing", () => {
	it("should process payment successfully", async () => {
		// Create test user
		const testEmail = generateUniqueEmail("subscription");
		const { token } = await createTestUser(app, testEmail, "Password123!");

		// Submit card payment
		const paymentRequest = createValidPaymentRequest(14.99);

		const res = await request(app)
			.post(`${PAYMENT_BASE}/card`)
			.set("Authorization", `Bearer ${token}`)
			.send(paymentRequest);

		// Verify payment success
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toBeDefined();
		expect(res.body.data.success).toBe(true);
		expect(res.body.data.paymentId).toBeDefined();
	});

	it("should persist payment record with correct amount", async () => {
		// Create test user
		const testEmail = generateUniqueEmail("subscription");
		const { token } = await createTestUser(app, testEmail, "Password123!");

		// Submit card payment
		const paymentRequest = createValidPaymentRequest(14.99);

		await request(app)
			.post(`${PAYMENT_BASE}/card`)
			.set("Authorization", `Bearer ${token}`)
			.send(paymentRequest);

		// Fetch payment history
		const historyRes = await request(app)
			.get(`${PAYMENT_BASE}`)
			.set("Authorization", `Bearer ${token}`);

		// Verify persisted amount matches
		expect(historyRes.status).toBe(200);
		expect(historyRes.body.data.payments).toHaveLength(1);
		expect(historyRes.body.data.payments[0].amount).toBe(14.99);
	});

	describe("Card Validation", () => {
		it("should reject payment with expired card", async () => {
			// Create test user
			const testEmail = generateUniqueEmail("subscription");
			const { token } = await createTestUser(app, testEmail, "Password123!");

			// Submit payment with expired card
			const paymentRequest = {
				subscriptionPrice: 9.99,
				cardDetails: createExpiredCardDetails(),
			};

			const res = await request(app)
				.post(`${PAYMENT_BASE}/card`)
				.set("Authorization", `Bearer ${token}`)
				.send(paymentRequest);

			// Verify validation failure response
			expect(res.status).toBe(400);
			expect(res.body.success).toBe(false);
			expect(res.body.message).toMatch(/validation.*failed/i);
			expect(res.body.details).toBeDefined();
			expect(Array.isArray(res.body.details)).toBe(true);

			// Verify expiry-specific error present
			const hasExpiryError = res.body.details.some(
				(e: { field: string; message: string }) =>
					e.field.toLowerCase().includes("expiry") && e.message.toLowerCase().includes("expired"),
			);
			expect(hasExpiryError).toBe(true);
		});
	});

	describe("Idempotency (duplicate payment prevention)", () => {
		it("should return cached result for same idempotency key", async () => {
			// Create test user
			const testEmail = generateUniqueEmail("subscription");
			const { token } = await createTestUser(app, testEmail, "Password123!");

			const paymentRequest = createValidPaymentRequest();
			const idempotencyKey = `test-idempotency-${Date.now()}`;

			// Submit first payment with idempotency key
			const res1 = await request(app)
				.post(`${PAYMENT_BASE}/card`)
				.set("Authorization", `Bearer ${token}`)
				.set("Idempotency-Key", idempotencyKey)
				.send(paymentRequest);

			const firstPaymentId = res1.body.data.paymentId;

			// Submit duplicate payment with same idempotency key
			const res2 = await request(app)
				.post(`${PAYMENT_BASE}/card`)
				.set("Authorization", `Bearer ${token}`)
				.set("Idempotency-Key", idempotencyKey)
				.send(paymentRequest);

			// Verify cached result returned with same payment ID
			expect(res2.status).toBe(200);
			expect(res2.body.success).toBe(true);
			expect(res2.body.data.paymentId).toBe(firstPaymentId);
		});

		it("should prevent double-charge with concurrent idempotency key", async () => {
			// Create test user
			const testEmail = generateUniqueEmail("subscription");
			const { token } = await createTestUser(app, testEmail, "Password123!");

			const paymentRequest = createValidPaymentRequest();
			const idempotencyKey = `test-rapid-click-${Date.now()}`;

			// Fire two concurrent payments with same idempotency key
			const [res1, res2] = await Promise.all([
				request(app)
					.post(`${PAYMENT_BASE}/card`)
					.set("Authorization", `Bearer ${token}`)
					.set("Idempotency-Key", idempotencyKey)
					.send(paymentRequest),
				new Promise<request.Response>((resolve) => {
					setTimeout(async () => {
						const response = await request(app)
							.post(`${PAYMENT_BASE}/card`)
							.set("Authorization", `Bearer ${token}`)
							.set("Idempotency-Key", idempotencyKey)
							.send(paymentRequest);
						resolve(response);
					}, 50);
				}),
			]);

			// Verify both succeed with same payment ID
			expect(res1.status).toBe(200);
			expect(res2.status).toBe(200);
			expect(res1.body.success).toBe(true);
			expect(res2.body.success).toBe(true);

			expect(res1.body.data.paymentId).toBe(res2.body.data.paymentId);

			// Verify only one payment record created
			const historyRes = await request(app)
				.get(`${PAYMENT_BASE}`)
				.set("Authorization", `Bearer ${token}`);

			const paymentsWithKey = historyRes.body.data.payments.filter(
				(p: { idempotencyKey: string | null }) => p.idempotencyKey === idempotencyKey,
			);
			expect(paymentsWithKey).toHaveLength(1);
		});
	});
});

describe("Post-Payment Updates", () => {
	it("should include premium subscription in payment response", async () => {
		// Create test user
		const testEmail = generateUniqueEmail("subscription");
		const { token } = await createTestUser(app, testEmail, "Password123!");

		// Submit payment for premium upgrade
		const paymentRequest = createValidPaymentRequest(9.99);

		const res = await request(app)
			.post(`${PAYMENT_BASE}/card`)
			.set("Authorization", `Bearer ${token}`)
			.send(paymentRequest);

		// Verify payment response includes premium subscription
		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.subscription).toBeDefined();
		expect(res.body.data.subscription.plan).toBe(SubscriptionPlan.PREMIUM);
	});

	it("should upgrade subscription plan after payment", async () => {
		// Create test user
		const testEmail = generateUniqueEmail("subscription");
		const { token } = await createTestUser(app, testEmail, "Password123!");

		// Submit payment for premium upgrade
		const paymentRequest = createValidPaymentRequest(9.99);

		await request(app)
			.post(`${PAYMENT_BASE}/card`)
			.set("Authorization", `Bearer ${token}`)
			.send(paymentRequest);

		// Verify subscription endpoint reflects upgrade
		const subRes = await request(app)
			.get(`${SUBSCRIPTION_BASE}`)
			.set("Authorization", `Bearer ${token}`);

		expect(subRes.status).toBe(200);
		expect(subRes.body.data.plan).toBe(SubscriptionPlan.PREMIUM);
	});

	it("should update user profile to premium status", async () => {
		// Create test user
		const testEmail = generateUniqueEmail("subscription");
		const { token } = await createTestUser(app, testEmail, "Password123!");

		// Submit payment for premium upgrade
		const paymentRequest = createValidPaymentRequest(9.99);

		await request(app)
			.post(`${PAYMENT_BASE}/card`)
			.set("Authorization", `Bearer ${token}`)
			.send(paymentRequest);

		// Verify user profile reflects premium status
		const meRes = await request(app)
			.get(`${AUTH_BASE}/me`)
			.set("Authorization", `Bearer ${token}`);

		expect(meRes.status).toBe(200);
		expect(meRes.body.data.subscriptionStatus).toBe(SubscriptionStatus.PREMIUM);
	});

	it("should mark payment as completed", async () => {
		// Create test user
		const testEmail = generateUniqueEmail("subscription");
		const { token } = await createTestUser(app, testEmail, "Password123!");

		// Submit payment for premium upgrade
		const paymentRequest = createValidPaymentRequest(9.99);

		await request(app)
			.post(`${PAYMENT_BASE}/card`)
			.set("Authorization", `Bearer ${token}`)
			.send(paymentRequest);

		// Verify payment record is completed
		const historyRes = await request(app)
			.get(`${PAYMENT_BASE}`)
			.set("Authorization", `Bearer ${token}`);

		expect(historyRes.status).toBe(200);
		expect(historyRes.body.data.payments).toHaveLength(1);
		expect(historyRes.body.data.payments[0].status).toBe(PaymentStatus.COMPLETED);
	});

	it("should remove playlist restriction after subscribing", async () => {
		// Create test user
		const testEmail = generateUniqueEmail("subscription");
		const { token } = await createTestUser(app, testEmail, "Password123!");

		// Create playlists up to free limit
		for (let i = 1; i <= FREE_PLAYLIST_LIMIT; i++) {
			await request(app)
				.post(PLAYLIST_BASE)
				.set("Authorization", `Bearer ${token}`)
				.send({ name: `Playlist ${i}` });
		}

		// Verify free limit blocks further creation
		const blockedRes = await request(app)
			.post(PLAYLIST_BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "Over Limit" });

		expect(blockedRes.status).toBe(403);

		// Upgrade to premium via payment
		const paymentRequest = createValidPaymentRequest(9.99);

		await request(app)
			.post(`${PAYMENT_BASE}/card`)
			.set("Authorization", `Bearer ${token}`)
			.send(paymentRequest);

		// Verify playlist creation now succeeds
		const unlockedRes = await request(app)
			.post(PLAYLIST_BASE)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "Premium Playlist" });

		expect(unlockedRes.status).toBe(201);
		expect(unlockedRes.body.success).toBe(true);
	});
});
