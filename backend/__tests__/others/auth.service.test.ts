/**
 * INTRO: Auth Service Integration Tests
 *
 * Tests authentication endpoints: register, login, getMe
 * Uses real MongoDB test database for integration testing.
 * These tests follow TDD approach - written BEFORE implementation.
 *
 * Test Coverage:
 * - POST /api/auth/register: User registration scenarios
 * - POST /api/auth/login: User login scenarios
 * - GET /api/auth/me: Get current user scenarios
 */

import * as dotenv from "dotenv";
dotenv.config();

import request from "supertest";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Application } from "express";
import { createApp } from "../../src/app";
import { loadConfig, Config } from "../../src/shared/config";

// Load test configuration (appends _test to database name)
const config: Config = loadConfig(true);
const API_BASE = "/api/auth";

// Test user data factory
const createTestUser = (overrides = {}) => ({
	email: "testuser@example.com",
	username: "testuser",
	password: "Password123!",
	displayName: "Test User",
	...overrides,
});

describe("Auth Service", () => {
	let app: Application;

	beforeAll(async () => {
		// Connect to test database
		await mongoose.connect(config.mongodbUri);

		// Create Express app
		app = createApp();
	});

	afterAll(async () => {
		// Clean up and disconnect
		await mongoose.connection.dropDatabase();
		await mongoose.disconnect();
	});

	beforeEach(async () => {
		// Clear all collections before each test
		const collections = mongoose.connection.collections;
		for (const key in collections) {
			const collection = collections[key];
			if (collection) {
				await collection.deleteMany({});
			}
		}
	});

	// ============================================
	// 1.1 Register User Tests
	// ============================================
	describe("POST /api/auth/register", () => {
		/**
		 * SCENARIO: Successful registration with valid data
		 * EXPECTATION: User is created, JWT token returned, password not exposed
		 */
		it("should register user successfully with valid data and return 201", async () => {
			// Arrange
			const userData = createTestUser();

			// Act
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(userData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();
			expect(response.body.data.accessToken).toBeDefined();
			expect(typeof response.body.data.accessToken).toBe("string");

			// User object should be returned without passwordHash
			expect(response.body.data.user).toBeDefined();
			expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
			expect(response.body.data.user.username).toBe(userData.username);
			expect(response.body.data.user.displayName).toBe(userData.displayName);
			expect(response.body.data.user.id).toBeDefined();

			// Password should NOT be in response
			expect(response.body.data.user.password).toBeUndefined();
			expect(response.body.data.user.passwordHash).toBeUndefined();
		});

		/**
		 * SCENARIO: Registration fails when email already exists
		 * EXPECTATION: 409 Conflict with appropriate error message
		 */
		it("should return 409 Conflict when email already exists", async () => {
			// Arrange - Create first user
			const userData = createTestUser();
			await request(app).post(`${API_BASE}/register`).send(userData);

			// Act - Try to register with same email but different username
			const duplicateEmailUser = createTestUser({
				username: "differentuser",
				email: userData.email,
			});
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(duplicateEmailUser)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(409);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/email.*already/i);
		});

		/**
		 * SCENARIO: Registration fails when username already exists
		 * EXPECTATION: 409 Conflict with appropriate error message
		 */
		it("should return 409 Conflict when username already exists", async () => {
			// Arrange - Create first user
			const userData = createTestUser();
			await request(app).post(`${API_BASE}/register`).send(userData);

			// Act - Try to register with same username but different email
			const duplicateUsernameUser = createTestUser({
				email: "different@example.com",
				username: userData.username,
			});
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(duplicateUsernameUser)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(409);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/username.*already/i);
		});

		/**
		 * SCENARIO: Registration fails with invalid email format
		 * EXPECTATION: 400 Bad Request with validation error
		 */
		it("should return 400 Bad Request with invalid email format", async () => {
			// Arrange
			const userData = createTestUser({ email: "not-an-email" });

			// Act
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(userData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toBeDefined();
		});

		/**
		 * SCENARIO: Registration fails with empty required fields
		 * EXPECTATION: 400 Bad Request with validation error
		 */
		it("should return 400 Bad Request when email is missing", async () => {
			// Arrange
			const userData = createTestUser({ email: "" });

			// Act
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(userData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Registration fails with empty required fields
		 * EXPECTATION: 400 Bad Request with validation error
		 */
		it("should return 400 Bad Request when username is missing", async () => {
			// Arrange
			const userData = createTestUser({ username: "" });

			// Act
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(userData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Registration fails with empty required fields
		 * EXPECTATION: 400 Bad Request with validation error
		 */
		it("should return 400 Bad Request when password is missing", async () => {
			// Arrange
			const userData = createTestUser({ password: "" });

			// Act
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(userData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Registration fails with empty required fields
		 * EXPECTATION: 400 Bad Request with validation error
		 */
		it("should return 400 Bad Request when displayName is missing", async () => {
			// Arrange
			const userData = createTestUser({ displayName: "" });

			// Act
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(userData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Email is stored lowercase regardless of input case
		 * EXPECTATION: Email stored in database is lowercase
		 */
		it("should store email lowercase regardless of input case", async () => {
			// Arrange
			const userData = createTestUser({ email: "Test@EXAMPLE.com" });

			// Act
			const response = await request(app)
				.post(`${API_BASE}/register`)
				.send(userData)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(201);
			expect(response.body.data.user.email).toBe("test@example.com");
		});
	});

	// ============================================
	// 1.2 Login User Tests
	// ============================================
	describe("POST /api/auth/login", () => {
		// Helper to create a registered user for login tests
		const registerUser = async (userData = createTestUser()) => {
			await request(app).post(`${API_BASE}/register`).send(userData);
			return userData;
		};

		/**
		 * SCENARIO: Successful login with valid credentials
		 * EXPECTATION: 200 OK with JWT token and user object
		 */
		it("should login successfully with valid credentials and return 200", async () => {
			// Arrange
			const userData = await registerUser();

			// Act
			const response = await request(app)
				.post(`${API_BASE}/login`)
				.send({
					email: userData.email,
					password: userData.password,
				})
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();
			expect(response.body.data.accessToken).toBeDefined();
			expect(typeof response.body.data.accessToken).toBe("string");

			// User object should be returned without passwordHash
			expect(response.body.data.user).toBeDefined();
			expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
			expect(response.body.data.user.username).toBe(userData.username);
			expect(response.body.data.user.id).toBeDefined();

			// Password should NOT be in response
			expect(response.body.data.user.password).toBeUndefined();
			expect(response.body.data.user.passwordHash).toBeUndefined();
		});

		/**
		 * SCENARIO: Login fails with incorrect password
		 * EXPECTATION: 401 Unauthorized with generic error message
		 */
		it("should return 401 Unauthorized with incorrect password", async () => {
			// Arrange
			const userData = await registerUser();

			// Act
			const response = await request(app)
				.post(`${API_BASE}/login`)
				.send({
					email: userData.email,
					password: "wrongpassword",
				})
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/invalid.*email.*password/i);
			expect(response.body.data?.accessToken).toBeUndefined();
		});

		/**
		 * SCENARIO: Login fails with non-existent email
		 * EXPECTATION: 401 Unauthorized with generic error message
		 */
		it("should return 401 Unauthorized with non-existent email", async () => {
			// Act - No user registered
			const response = await request(app)
				.post(`${API_BASE}/login`)
				.send({
					email: "nonexistent@example.com",
					password: "anypassword",
				})
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
			expect(response.body.error).toMatch(/invalid.*email.*password/i);
		});

		/**
		 * SCENARIO: Login is case-insensitive for email
		 * EXPECTATION: Login succeeds with different email case
		 */
		it("should login successfully with case-insensitive email", async () => {
			// Arrange - Register with lowercase email
			const userData = await registerUser({ ...createTestUser(), email: "test@example.com" });

			// Act - Login with uppercase email
			const response = await request(app)
				.post(`${API_BASE}/login`)
				.send({
					email: "TEST@Example.COM",
					password: userData.password,
				})
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data.accessToken).toBeDefined();
		});
	});

	// ============================================
	// 1.3 Get Current User (Me) Tests
	// ============================================
	describe("GET /api/auth/me", () => {
		// Helper to register and get a valid token
		const getAuthToken = async (userData = createTestUser()) => {
			const response = await request(app).post(`${API_BASE}/register`).send(userData);
			return {
				token: response.body.data.accessToken,
				user: response.body.data.user,
			};
		};

		/**
		 * SCENARIO: Get current user with valid token
		 * EXPECTATION: 200 OK with user object
		 */
		it("should return current user with valid token and return 200", async () => {
			// Arrange
			const { token, user } = await getAuthToken();

			// Act
			const response = await request(app)
				.get(`${API_BASE}/me`)
				.set("Authorization", `Bearer ${token}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.data).toBeDefined();
			expect(response.body.data.id).toBe(user.id);
			expect(response.body.data.email).toBe(user.email);
			expect(response.body.data.username).toBe(user.username);
			expect(response.body.data.displayName).toBe(user.displayName);

			// Password should NOT be in response
			expect(response.body.data.password).toBeUndefined();
			expect(response.body.data.passwordHash).toBeUndefined();
		});

		/**
		 * SCENARIO: Get current user fails without token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized without token", async () => {
			// Act - No Authorization header
			const response = await request(app)
				.get(`${API_BASE}/me`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Get current user fails with invalid token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized with invalid token", async () => {
			// Arrange
			const invalidToken = "invalid.jwt.token";

			// Act
			const response = await request(app)
				.get(`${API_BASE}/me`)
				.set("Authorization", `Bearer ${invalidToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Get current user fails with malformed Authorization header
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized with malformed Authorization header", async () => {
			// Arrange
			const { token } = await getAuthToken();

			// Act - Missing "Bearer" prefix
			const response = await request(app)
				.get(`${API_BASE}/me`)
				.set("Authorization", token)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Get current user fails with expired token
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized with expired token", async () => {
			// Arrange - Create an expired token
			const { user } = await getAuthToken();
			const expiredToken = jwt.sign(
				{
					userId: user.id,
					email: user.email,
					username: user.username,
				},
				config.jwtSecret,
				{ expiresIn: "-1h" } // Already expired
			);

			// Act
			const response = await request(app)
				.get(`${API_BASE}/me`)
				.set("Authorization", `Bearer ${expiredToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});

		/**
		 * SCENARIO: Get current user fails with token signed with wrong secret
		 * EXPECTATION: 401 Unauthorized
		 */
		it("should return 401 Unauthorized with token signed with wrong secret", async () => {
			// Arrange
			const { user } = await getAuthToken();
			const wrongSecretToken = jwt.sign(
				{
					userId: user.id,
					email: user.email,
					username: user.username,
				},
				"wrong-secret-key",
				{ expiresIn: "1h" }
			);

			// Act
			const response = await request(app)
				.get(`${API_BASE}/me`)
				.set("Authorization", `Bearer ${wrongSecretToken}`)
				.expect("Content-Type", /json/);

			// Assert
			expect(response.status).toBe(401);
			expect(response.body.success).toBe(false);
		});
	});
});
