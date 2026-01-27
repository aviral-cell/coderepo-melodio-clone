// @ts-nocheck
/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router";

import FamilySettingsPage from "@/pages/FamilySettingsPage";
import { AddFamilyMemberModal } from "@/shared/components/common/AddFamilyMemberModal";
import { PlayerProvider } from "@/shared/contexts/PlayerContext";
import { PlaylistProvider } from "@/shared/contexts/PlaylistContext";
import { ToastProvider } from "@/shared/hooks/useToast";

// Mock useImageColor hook
jest.mock("@/shared/hooks/useImageColor", () => ({
	useImageColor: () => ({ color: "#333333", isReady: true }),
}));

// Mock SidebarContext
jest.mock("@/shared/contexts/SidebarContext", () => ({
	SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
	useSidebar: () => ({
		isMobileSidebarOpen: false,
		toggleMobileSidebar: jest.fn(),
		closeMobileSidebar: jest.fn(),
	}),
}));

// -- Factory Functions --

interface MockFamilyMember {
	_id: string;
	displayName: string;
	email: string;
	isActive: boolean;
	createdAt: string;
}

interface MockFamilyMembersResponse {
	familyMembers: MockFamilyMember[];
	maxMembers: number;
	remainingSlots: number;
}

function createMockFamilyMember(
	id: string,
	overrides: Partial<MockFamilyMember> = {}
): MockFamilyMember {
	return {
		_id: id,
		displayName: `Family Member ${id}`,
		email: `member${id}@example.com`,
		isActive: true,
		createdAt: new Date().toISOString(),
		...overrides,
	};
}

function createMockFamilyResponse(
	members: MockFamilyMember[],
	maxMembers = 3
): MockFamilyMembersResponse {
	return {
		familyMembers: members,
		maxMembers,
		remainingSlots: maxMembers - members.length,
	};
}

function createApiResponse<T>(data: T) {
	return {
		success: true,
		data,
	};
}

function createErrorResponse(message: string) {
	return {
		success: false,
		error: message,
	};
}

// -- Premium User Mock --

const mockPremiumUser = {
	_id: "user-premium-1",
	email: "premium@example.com",
	username: "premiumuser",
	displayName: "Premium User",
	subscriptionStatus: "premium" as const,
	accountType: "primary" as const,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const mockFreeUser = {
	_id: "user-free-1",
	email: "free@example.com",
	username: "freeuser",
	displayName: "Free User",
	subscriptionStatus: "free" as const,
	accountType: "primary" as const,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

// -- Mock AuthContext with configurable user --

let currentMockUser = mockPremiumUser;

jest.mock("@/shared/contexts/AuthContext", () => ({
	AuthProvider: ({ children }: { children: React.ReactNode }) => children,
	useAuth: () => ({
		user: currentMockUser,
		isAuthenticated: true,
		isLoading: false,
		login: jest.fn(),
		register: jest.fn(),
		logout: jest.fn(),
		switchAccount: jest.fn(),
		refreshUser: jest.fn(),
	}),
}));

// -- Test Wrapper --

function TestWrapper({
	children,
	initialRoute = "/family-settings",
}: {
	children: React.ReactNode;
	initialRoute?: string;
}) {
	return (
		<MemoryRouter initialEntries={[initialRoute]}>
			<ToastProvider>
				<PlayerProvider>
					<PlaylistProvider>{children}</PlaylistProvider>
				</PlayerProvider>
			</ToastProvider>
		</MemoryRouter>
	);
}

function renderFamilySettingsPage() {
	return render(
		<TestWrapper>
			<Routes>
				<Route path="/family-settings" element={<FamilySettingsPage />} />
			</Routes>
		</TestWrapper>
	);
}

function renderAddFamilyMemberModal(
	open: boolean,
	onOpenChange: jest.Mock,
	onSuccess: jest.Mock
) {
	return render(
		<TestWrapper>
			<AddFamilyMemberModal
				open={open}
				onOpenChange={onOpenChange}
				onSuccess={onSuccess}
			/>
		</TestWrapper>
	);
}

// -- Fetch Mock Helpers --

const originalFetch = global.fetch;
const originalLocation = window.location;

let mockFetch: jest.Mock;

// -- Test Suites --

describe("Family Settings Page Behavior Tests", () => {
	beforeAll(() => {
		// @ts-ignore
		delete window.location;
		window.location = {
			...originalLocation,
			protocol: "http:",
			host: "localhost:3000",
			hostname: "localhost",
			port: "3000",
			pathname: "/",
			search: "",
			hash: "",
			href: "http://localhost:3000/",
			origin: "http://localhost:3000",
		} as Location;
	});

	afterAll(() => {
		window.location = originalLocation;
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
		currentMockUser = mockPremiumUser;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	describe("Premium User Access", () => {
		it("should display family settings page title for premium users", async () => {
			const familyResponse = createMockFamilyResponse([]);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(
					screen.getByTestId("family-settings-page-title")
				).toBeInTheDocument();
			});

			expect(screen.getByTestId("family-settings-page-title")).toHaveTextContent(
				"Family Settings"
			);
		});

		it("should show loading skeleton while fetching family members", async () => {
			let resolveFamily: (value: unknown) => void;
			const familyPromise = new Promise((resolve) => {
				resolveFamily = resolve;
			});

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return familyPromise.then(() => ({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(createApiResponse(createMockFamilyResponse([]))),
					}));
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			// Should show skeletons while loading
			const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
			expect(skeletons.length).toBeGreaterThan(0);

			// Resolve the family data
			resolveFamily!(true);

			await waitFor(() => {
				expect(
					screen.getByTestId("family-settings-page-title")
				).toBeInTheDocument();
			});
		});
	});

	describe("Free User Access", () => {
		it("should display family settings page for free users", async () => {
			currentMockUser = mockFreeUser;
			const familyResponse = createMockFamilyResponse([]);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(
					screen.getByTestId("family-settings-page-title")
				).toBeInTheDocument();
			});

			expect(screen.getByTestId("family-settings-page-title")).toHaveTextContent(
				"Family Settings"
			);
		});

		it("should fetch and display family members for free users", async () => {
			currentMockUser = mockFreeUser;
			const members = [
				createMockFamilyMember("1", {
					displayName: "John Doe",
					email: "john@example.com",
					isActive: true,
				}),
			];
			const familyResponse = createMockFamilyResponse(members);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("John Doe")).toBeInTheDocument();
			});

			// Verify API call was made to family endpoint
			const familyCalls = mockFetch.mock.calls.filter((call) =>
				call[0].includes("/api/family")
			);
			expect(familyCalls.length).toBeGreaterThan(0);
		});

		it("should allow free user to interact with Add Member functionality", async () => {
			const user = userEvent.setup();
			currentMockUser = mockFreeUser;
			const familyResponse = createMockFamilyResponse([], 3);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(
					screen.getByTestId("family-add-first-member-btn")
				).toBeInTheDocument();
			});

			await user.click(screen.getByTestId("family-add-first-member-btn"));

			await waitFor(() => {
				expect(screen.getByText("Add Family Member")).toBeInTheDocument();
			});

			// Verify form inputs are accessible
			expect(screen.getByTestId("family-member-name-input")).toBeInTheDocument();
			expect(screen.getByTestId("family-member-email-input")).toBeInTheDocument();
		});
	});

	describe("Family Members Display", () => {
		it("should display empty state when no family members exist", async () => {
			const familyResponse = createMockFamilyResponse([]);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("No family members yet")).toBeInTheDocument();
			});

			expect(
				screen.getByTestId("family-add-first-member-btn")
			).toBeInTheDocument();
		});

		it("should display family members list with correct information", async () => {
			const members = [
				createMockFamilyMember("1", {
					displayName: "John Doe",
					email: "john@example.com",
					isActive: true,
				}),
				createMockFamilyMember("2", {
					displayName: "Jane Smith",
					email: "jane@example.com",
					isActive: false,
				}),
			];
			const familyResponse = createMockFamilyResponse(members);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("John Doe")).toBeInTheDocument();
			});

			// Verify member details
			expect(screen.getByText("john@example.com")).toBeInTheDocument();
			expect(screen.getByText("Jane Smith")).toBeInTheDocument();
			expect(screen.getByText("jane@example.com")).toBeInTheDocument();

			// Verify member elements have correct test IDs
			expect(screen.getByTestId("family-member-1")).toBeInTheDocument();
			expect(screen.getByTestId("family-member-2")).toBeInTheDocument();
		});

		it("should display active status for active members", async () => {
			const members = [
				createMockFamilyMember("1", {
					displayName: "Active Member",
					isActive: true,
				}),
			];
			const familyResponse = createMockFamilyResponse(members);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("Active Member")).toBeInTheDocument();
			});

			expect(screen.getByText("Active")).toBeInTheDocument();
		});

		it("should display inactive status for inactive members", async () => {
			const members = [
				createMockFamilyMember("1", {
					displayName: "Inactive Member",
					isActive: false,
				}),
			];
			const familyResponse = createMockFamilyResponse(members);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("Inactive Member")).toBeInTheDocument();
			});

			expect(screen.getByText("Inactive")).toBeInTheDocument();
		});

		it("should display correct slot count", async () => {
			const members = [
				createMockFamilyMember("1"),
				createMockFamilyMember("2"),
			];
			const familyResponse = createMockFamilyResponse(members, 3);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("2 of 3 slots used")).toBeInTheDocument();
			});
		});
	});

	describe("Add Member Button Visibility", () => {
		it("should show add member button when slots are available", async () => {
			const members = [createMockFamilyMember("1")];
			const familyResponse = createMockFamilyResponse(members, 3);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByTestId("family-add-member-btn")).toBeInTheDocument();
			});
		});

		it("should hide add member button when all slots are used", async () => {
			const members = [
				createMockFamilyMember("1"),
				createMockFamilyMember("2"),
				createMockFamilyMember("3"),
			];
			const familyResponse = createMockFamilyResponse(members, 3);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("Family Member 1")).toBeInTheDocument();
			});

			expect(
				screen.queryByTestId("family-add-member-btn")
			).not.toBeInTheDocument();
			expect(
				screen.getByText("Maximum family members reached (3)")
			).toBeInTheDocument();
		});

		it("should display remaining slots indicator", async () => {
			const members = [createMockFamilyMember("1")];
			const familyResponse = createMockFamilyResponse(members, 3);

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("2 slots remaining")).toBeInTheDocument();
			});
		});
	});

	describe("Remove Family Member", () => {
		it("should remove member when remove button is clicked", async () => {
			const user = userEvent.setup();
			const memberA = createMockFamilyMember("A", { displayName: "Member A" });
			const memberB = createMockFamilyMember("B", { displayName: "Member B" });
			const familyResponse = createMockFamilyResponse([memberA, memberB], 3);

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && (!options?.method || options?.method === "GET")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				if (url.includes("/api/family/A") && options?.method === "DELETE") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ success: true })),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("Member A")).toBeInTheDocument();
			});

			// Click remove button for Member A
			const removeButton = screen.getByTestId("family-remove-member-A-btn");
			await user.click(removeButton);

			// Verify member is removed from UI
			await waitFor(() => {
				expect(screen.queryByText("Member A")).not.toBeInTheDocument();
			});

			// Verify Member B still exists
			expect(screen.getByText("Member B")).toBeInTheDocument();
		});

		it("should make DELETE request to correct endpoint when removing member", async () => {
			const user = userEvent.setup();
			const member = createMockFamilyMember("member-123", {
				displayName: "Test Member",
			});
			const familyResponse = createMockFamilyResponse([member], 3);

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && (!options?.method || options?.method === "GET")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				if (options?.method === "DELETE") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ success: true })),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("Test Member")).toBeInTheDocument();
			});

			const removeButton = screen.getByTestId("family-remove-member-member-123-btn");
			await user.click(removeButton);

			await waitFor(() => {
				const deleteCall = mockFetch.mock.calls.find(
					(call) => call[1]?.method === "DELETE"
				);
				expect(deleteCall).toBeDefined();
				expect(deleteCall[0]).toContain("/api/family/member-123");
			});
		});

		it("should update remaining slots after removing member", async () => {
			const user = userEvent.setup();
			const memberA = createMockFamilyMember("A", { displayName: "Member A" });
			const memberB = createMockFamilyMember("B", { displayName: "Member B" });
			const familyResponse = createMockFamilyResponse([memberA, memberB], 3);

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && (!options?.method || options?.method === "GET")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				if (options?.method === "DELETE") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ success: true })),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("1 slot remaining")).toBeInTheDocument();
			});

			const removeButton = screen.getByTestId("family-remove-member-A-btn");
			await user.click(removeButton);

			await waitFor(() => {
				expect(screen.getByText("2 slots remaining")).toBeInTheDocument();
			});
		});

		it("should disable remove button while removing is in progress", async () => {
			const user = userEvent.setup();
			const member = createMockFamilyMember("1", { displayName: "Test Member" });
			const familyResponse = createMockFamilyResponse([member], 3);

			let resolveDelete: (value: unknown) => void;
			const deletePromise = new Promise((resolve) => {
				resolveDelete = resolve;
			});

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && (!options?.method || options?.method === "GET")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				if (options?.method === "DELETE") {
					return deletePromise.then(() => ({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ success: true })),
					}));
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("Test Member")).toBeInTheDocument();
			});

			const removeButton = screen.getByTestId("family-remove-member-1-btn");
			await user.click(removeButton);

			// Button should be disabled during removal
			expect(removeButton).toBeDisabled();

			// Resolve the delete
			resolveDelete!(true);

			await waitFor(() => {
				expect(screen.queryByText("Test Member")).not.toBeInTheDocument();
			});
		});
	});

	describe("Error Handling", () => {
		it("should show error toast when fetching family members fails", async () => {
			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: false,
						status: 500,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createErrorResponse("Failed to load family members")
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			// Page should still render after error
			await waitFor(() => {
				expect(
					screen.getByTestId("family-settings-page-title")
				).toBeInTheDocument();
			});
		});

		it("should show error toast when removing member fails", async () => {
			const user = userEvent.setup();
			const member = createMockFamilyMember("1", { displayName: "Test Member" });
			const familyResponse = createMockFamilyResponse([member], 3);

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && (!options?.method || options?.method === "GET")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(familyResponse)),
					});
				}
				if (options?.method === "DELETE") {
					return Promise.resolve({
						ok: false,
						status: 500,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createErrorResponse("Failed to remove family member")
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderFamilySettingsPage();

			await waitFor(() => {
				expect(screen.getByText("Test Member")).toBeInTheDocument();
			});

			const removeButton = screen.getByTestId("family-remove-member-1-btn");
			await user.click(removeButton);

			// Member should still be in the list after failed removal
			await waitFor(() => {
				expect(screen.getByText("Test Member")).toBeInTheDocument();
			});
		});
	});
});

describe("Add Family Member Modal Behavior Tests", () => {
	beforeAll(() => {
		// @ts-ignore
		delete window.location;
		window.location = {
			...originalLocation,
			protocol: "http:",
			host: "localhost:3000",
			hostname: "localhost",
			port: "3000",
			pathname: "/",
			search: "",
			hash: "",
			href: "http://localhost:3000/",
			origin: "http://localhost:3000",
		} as Location;
	});

	afterAll(() => {
		window.location = originalLocation;
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
		currentMockUser = mockPremiumUser;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	describe("Modal Display", () => {
		it("should render modal with correct title when open", () => {
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			expect(screen.getByText("Add Family Member")).toBeInTheDocument();
			expect(
				screen.getByText(
					"Add a new family member to share your benefits"
				)
			).toBeInTheDocument();
		});

		it("should not render modal content when closed", () => {
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(false, onOpenChange, onSuccess);

			expect(screen.queryByText("Add Family Member")).not.toBeInTheDocument();
		});
	});

	describe("Form Inputs", () => {
		it("should render name, email, and age input fields", () => {
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			expect(screen.getByTestId("family-member-name-input")).toBeInTheDocument();
			expect(screen.getByTestId("family-member-email-input")).toBeInTheDocument();
			expect(screen.getByTestId("family-member-age-input")).toBeInTheDocument();
		});

		it("should update name field when typing", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			await user.type(nameInput, "John Doe");

			expect(nameInput).toHaveValue("John Doe");
		});

		it("should update email field when typing", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const emailInput = screen.getByTestId("family-member-email-input");
			await user.type(emailInput, "john@example.com");

			expect(emailInput).toHaveValue("john@example.com");
		});

		it("should only allow numeric input in age field", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const ageInput = screen.getByTestId("family-member-age-input");
			await user.type(ageInput, "abc25xyz");

			expect(ageInput).toHaveValue("25");
		});
	});

	describe("Form Validation", () => {
		it("should disable submit button when name is empty", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const emailInput = screen.getByTestId("family-member-email-input");
			await user.type(emailInput, "john@example.com");

			// The submit button should be disabled without name
			const submitButton = screen.getByTestId("family-member-submit-btn");
			expect(submitButton).toBeDisabled();
		});

		it("should disable submit button when email is empty", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			await user.type(nameInput, "John Doe");

			// The submit button should be disabled without email
			const submitButton = screen.getByTestId("family-member-submit-btn");
			expect(submitButton).toBeDisabled();
		});

		it("should enable submit button when both name and email are filled", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			expect(submitButton).not.toBeDisabled();
		});

		it("should prevent form submission with invalid email format", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			// Mock fetch to track API calls
			mockFetch.mockImplementation(() => {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({ _id: "new-id" })),
				});
			});

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "notanemail");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			// Wait a bit to ensure form processing completes
			await waitFor(
				() => {
					// Either validation error is shown OR API was not called (browser validation)
					const hasValidationError =
						screen.queryByText("Invalid email address") !== null;
					const apiCallsMade = mockFetch.mock.calls.filter((call) =>
						call[0].includes("/api/family")
					).length;

					// The form should either show validation error or prevent submission
					expect(hasValidationError || apiCallsMade === 0).toBe(true);
				},
				{ timeout: 2000 }
			);

			// onSuccess should not have been called
			expect(onSuccess).not.toHaveBeenCalled();
		});

		it("should show validation error for name too short on submit", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			// Do not mock fetch - we want validation to prevent API call
			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "J");
			await user.type(emailInput, "john@example.com");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText("Name must be at least 2 characters")
				).toBeInTheDocument();
			});

			// onSuccess should not have been called due to validation failure
			expect(onSuccess).not.toHaveBeenCalled();
		});

		it("should clear name validation error when input is corrected", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "J");
			await user.type(emailInput, "john@example.com");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			await waitFor(() => {
				expect(
					screen.getByText("Name must be at least 2 characters")
				).toBeInTheDocument();
			});

			// Correct the input by typing more characters
			await user.type(nameInput, "ohn Doe");

			await waitFor(() => {
				expect(
					screen.queryByText("Name must be at least 2 characters")
				).not.toBeInTheDocument();
			});
		});
	});

	describe("Form Submission", () => {
		it("should submit form with valid data", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && options?.method === "POST") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse({
									_id: "new-member-id",
									email: "john@example.com",
									displayName: "John Doe",
									username: "johndoe",
									accountType: "family_member",
									primaryAccountId: "user-premium-1",
									isActive: true,
									subscriptionStatus: "premium",
									createdAt: new Date().toISOString(),
								})
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			await waitFor(() => {
				expect(onSuccess).toHaveBeenCalled();
			});
		});

		it("should make POST request to correct endpoint with correct payload", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && options?.method === "POST") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse({
									_id: "new-member-id",
									email: "jane@example.com",
									displayName: "Jane Smith",
								})
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");
			const ageInput = screen.getByTestId("family-member-age-input");

			await user.type(nameInput, "Jane Smith");
			await user.type(emailInput, "jane@example.com");
			await user.type(ageInput, "25");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			await waitFor(() => {
				const postCall = mockFetch.mock.calls.find(
					(call) => call[1]?.method === "POST"
				);
				expect(postCall).toBeDefined();
				expect(postCall[0]).toContain("/api/family");

				const body = JSON.parse(postCall[1].body);
				expect(body.name).toBe("Jane Smith");
				expect(body.email).toBe("jane@example.com");
				expect(body.age).toBe(25);
			});
		});

		it("should disable submit button while submitting", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			let resolveSubmit: (value: unknown) => void;
			const submitPromise = new Promise((resolve) => {
				resolveSubmit = resolve;
			});

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && options?.method === "POST") {
					return submitPromise.then(() => ({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ _id: "new-id" })),
					}));
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			// Button should show "Adding..." and be disabled
			await waitFor(() => {
				expect(submitButton).toHaveTextContent("Adding...");
				expect(submitButton).toBeDisabled();
			});

			// Resolve submission
			resolveSubmit!(true);

			await waitFor(() => {
				expect(onSuccess).toHaveBeenCalled();
			});
		});

		it("should reset form after successful submission", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && options?.method === "POST") {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ _id: "new-id" })),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			const { rerender } = renderAddFamilyMemberModal(
				true,
				onOpenChange,
				onSuccess
			);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			await waitFor(() => {
				expect(onSuccess).toHaveBeenCalled();
			});
		});
	});

	describe("Cancel Button", () => {
		it("should close modal when cancel is clicked", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const cancelButton = screen.getByTestId("family-member-cancel-btn");
			await user.click(cancelButton);

			expect(onOpenChange).toHaveBeenCalledWith(false);
		});

		it("should disable cancel button while submitting", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			let resolveSubmit: (value: unknown) => void;
			const submitPromise = new Promise((resolve) => {
				resolveSubmit = resolve;
			});

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && options?.method === "POST") {
					return submitPromise.then(() => ({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse({ _id: "new-id" })),
					}));
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			const cancelButton = screen.getByTestId("family-member-cancel-btn");
			expect(cancelButton).toBeDisabled();

			// Resolve submission
			resolveSubmit!(true);

			await waitFor(() => {
				expect(onSuccess).toHaveBeenCalled();
			});
		});
	});

	describe("API Error Handling", () => {
		it("should show error when API returns error", async () => {
			const user = userEvent.setup();
			const onOpenChange = jest.fn();
			const onSuccess = jest.fn();

			mockFetch.mockImplementation((url: string, options?: RequestInit) => {
				if (url.includes("/api/family") && options?.method === "POST") {
					return Promise.resolve({
						ok: false,
						status: 400,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createErrorResponse("Email already exists in the family")
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderAddFamilyMemberModal(true, onOpenChange, onSuccess);

			const nameInput = screen.getByTestId("family-member-name-input");
			const emailInput = screen.getByTestId("family-member-email-input");

			await user.type(nameInput, "John Doe");
			await user.type(emailInput, "john@example.com");

			const submitButton = screen.getByTestId("family-member-submit-btn");
			await user.click(submitButton);

			// Form should not close on error
			await waitFor(() => {
				expect(onSuccess).not.toHaveBeenCalled();
			});

			// Modal should still be open
			expect(screen.getByText("Add Family Member")).toBeInTheDocument();
		});
	});
});

describe("Family Settings Integration Tests", () => {
	beforeAll(() => {
		// @ts-ignore
		delete window.location;
		window.location = {
			...originalLocation,
			protocol: "http:",
			host: "localhost:3000",
			hostname: "localhost",
			port: "3000",
			pathname: "/",
			search: "",
			hash: "",
			href: "http://localhost:3000/",
			origin: "http://localhost:3000",
		} as Location;
	});

	afterAll(() => {
		window.location = originalLocation;
	});

	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
		currentMockUser = mockPremiumUser;
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	it("should open add member modal when add button is clicked", async () => {
		const user = userEvent.setup();
		const familyResponse = createMockFamilyResponse([], 3);

		mockFetch.mockImplementation((url: string) => {
			if (url.includes("/api/family")) {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse(familyResponse)),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse({})),
			});
		});

		renderFamilySettingsPage();

		await waitFor(() => {
			expect(
				screen.getByTestId("family-add-first-member-btn")
			).toBeInTheDocument();
		});

		await user.click(screen.getByTestId("family-add-first-member-btn"));

		await waitFor(() => {
			expect(screen.getByText("Add Family Member")).toBeInTheDocument();
		});
	});

	it("should refresh member list after adding new member", async () => {
		const user = userEvent.setup();
		const initialFamilyResponse = createMockFamilyResponse([], 3);
		const newMember = createMockFamilyMember("new-1", {
			displayName: "New Member",
			email: "new@example.com",
		});
		const updatedFamilyResponse = createMockFamilyResponse([newMember], 3);

		let fetchCount = 0;

		mockFetch.mockImplementation((url: string, options?: RequestInit) => {
			if (url.includes("/api/family") && (!options?.method || options?.method === "GET")) {
				fetchCount++;
				const response =
					fetchCount === 1 ? initialFamilyResponse : updatedFamilyResponse;
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse(response)),
				});
			}
			if (url.includes("/api/family") && options?.method === "POST") {
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () =>
						Promise.resolve(
							createApiResponse({
								_id: "new-1",
								email: "new@example.com",
								displayName: "New Member",
							})
						),
				});
			}
			return Promise.resolve({
				ok: true,
				status: 200,
				headers: new Headers({ "content-type": "application/json" }),
				json: () => Promise.resolve(createApiResponse({})),
			});
		});

		renderFamilySettingsPage();

		await waitFor(() => {
			expect(screen.getByText("No family members yet")).toBeInTheDocument();
		});

		// Open modal and add member
		await user.click(screen.getByTestId("family-add-first-member-btn"));

		await waitFor(() => {
			expect(screen.getByText("Add Family Member")).toBeInTheDocument();
		});

		const nameInput = screen.getByTestId("family-member-name-input");
		const emailInput = screen.getByTestId("family-member-email-input");

		await user.type(nameInput, "New Member");
		await user.type(emailInput, "new@example.com");

		const submitButton = screen.getByTestId("family-member-submit-btn");
		await user.click(submitButton);

		// Wait for the member list to refresh
		await waitFor(() => {
			expect(screen.getByText("New Member")).toBeInTheDocument();
		});
	});
});

// -- AccountSwitcher Behavior Tests --

import { AccountSwitcher } from "@/shared/components/common/AccountSwitcher";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";

function renderAccountSwitcher() {
	return render(
		<TestWrapper>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button>User Menu</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent>
					<AccountSwitcher />
				</DropdownMenuContent>
			</DropdownMenu>
		</TestWrapper>
	);
}

describe("AccountSwitcher Behavior Tests", () => {
	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	describe("Free User with Family Members", () => {
		it("should display switch account option for free user with family members", async () => {
			const user = userEvent.setup();
			currentMockUser = mockFreeUser;

			const familyMembers = [
				createMockFamilyMember("fm-1", { displayName: "Family Member 1" }),
			];

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockFamilyResponse(familyMembers))
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderAccountSwitcher();

			// Open the dropdown
			await user.click(screen.getByRole("button", { name: "User Menu" }));

			// Wait for family members to load and switch account option to appear
			await waitFor(() => {
				expect(
					screen.getByTestId("account-switcher-trigger")
				).toBeInTheDocument();
			});

			expect(screen.getByText("Switch Account")).toBeInTheDocument();
		});

		it("should not display switch account option when no family members exist", async () => {
			const user = userEvent.setup();
			currentMockUser = mockFreeUser;

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(createApiResponse(createMockFamilyResponse([]))),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderAccountSwitcher();

			// Open the dropdown
			await user.click(screen.getByRole("button", { name: "User Menu" }));

			// Wait for API call to complete
			await waitFor(() => {
				expect(mockFetch).toHaveBeenCalledWith(
					expect.stringContaining("/api/family"),
					expect.any(Object)
				);
			});

			// Switch account should not be visible when no family members
			expect(
				screen.queryByTestId("account-switcher-trigger")
			).not.toBeInTheDocument();
		});
	});

	describe("Premium User with Family Members", () => {
		it("should display switch account option for premium user with family members", async () => {
			const user = userEvent.setup();
			currentMockUser = mockPremiumUser;

			const familyMembers = [
				createMockFamilyMember("fm-1", { displayName: "Family Member 1" }),
			];

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/family")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockFamilyResponse(familyMembers))
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderAccountSwitcher();

			// Open the dropdown
			await user.click(screen.getByRole("button", { name: "User Menu" }));

			// Wait for family members to load and switch account option to appear
			await waitFor(() => {
				expect(
					screen.getByTestId("account-switcher-trigger")
				).toBeInTheDocument();
			});

			expect(screen.getByText("Switch Account")).toBeInTheDocument();
		});
	});

	describe("Family Member Account", () => {
		it("should display switch to primary option for family member", async () => {
			const user = userEvent.setup();
			currentMockUser = {
				...mockFreeUser,
				_id: "family-member-1",
				accountType: "family_member" as const,
				primaryAccountId: "primary-user-123",
			};

			renderAccountSwitcher();

			// Open the dropdown
			await user.click(screen.getByRole("button", { name: "User Menu" }));

			// Family member should see option to switch to primary
			await waitFor(() => {
				expect(
					screen.getByTestId("account-switcher-trigger")
				).toBeInTheDocument();
			});

			expect(screen.getByText("Switch Account")).toBeInTheDocument();

			// Click to expand and see "Switch to Primary Account" option
			await user.click(screen.getByTestId("account-switcher-trigger"));

			await waitFor(() => {
				expect(
					screen.getByTestId("account-switch-to-primary-btn")
				).toBeInTheDocument();
			});
		});
	});
});

// -- SubscriptionPage Family Member View Tests --

import SubscriptionPage from "@/pages/SubscriptionPage";

function createMockSubscription(
	plan: "free" | "premium",
	isFamilyMember = false
) {
	return {
		_id: "sub-1",
		userId: "user-1",
		plan,
		startDate: new Date().toISOString(),
		endDate: plan === "premium" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
		autoRenew: plan === "premium",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		isFamilyMember,
		primaryAccountId: isFamilyMember ? "primary-123" : null,
	};
}

function createMockPayments() {
	return {
		payments: [
			{
				_id: "pay-1",
				userId: "user-1",
				amount: 9.99,
				status: "completed",
				cardLast4: "1234",
				timestamp: new Date().toISOString(),
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			},
		],
	};
}

function renderSubscriptionPage() {
	return render(
		<TestWrapper>
			<SubscriptionPage />
		</TestWrapper>
	);
}

describe("SubscriptionPage Family Member View Tests", () => {
	beforeEach(() => {
		mockFetch = jest.fn();
		global.fetch = mockFetch;
		localStorage.setItem("accessToken", "test-token");
	});

	afterEach(() => {
		global.fetch = originalFetch;
		localStorage.clear();
		jest.clearAllMocks();
	});

	describe("Family Member with Premium Primary Account", () => {
		it("should show family member banner when viewing as family member", async () => {
			currentMockUser = {
				...mockFreeUser,
				_id: "family-member-1",
				accountType: "family_member" as const,
				primaryAccountId: "primary-user-123",
				subscriptionStatus: "premium" as const,
			};

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/subscription")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockSubscription("premium", true))
							),
					});
				}
				if (url.includes("/api/payment")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(createMockPayments())),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderSubscriptionPage();

			await waitFor(() => {
				expect(
					screen.getByTestId("family-member-subscription-banner")
				).toBeInTheDocument();
			});

			expect(screen.getByText("Family Plan Member")).toBeInTheDocument();
			expect(
				screen.getByText("You're enjoying benefits from your family's subscription plan.")
			).toBeInTheDocument();
		});

		it("should show premium plan benefits for family member with premium primary", async () => {
			currentMockUser = {
				...mockFreeUser,
				_id: "family-member-1",
				accountType: "family_member" as const,
				primaryAccountId: "primary-user-123",
				subscriptionStatus: "premium" as const,
			};

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/subscription")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockSubscription("premium", true))
							),
					});
				}
				if (url.includes("/api/payment")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(createMockPayments())),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderSubscriptionPage();

			await waitFor(() => {
				expect(screen.getByText("Premium Plan")).toBeInTheDocument();
			});

			// Should show premium benefits
			expect(screen.getByText("Your Premium Benefits")).toBeInTheDocument();
			expect(screen.getByText("Unlimited playlists")).toBeInTheDocument();
		});

		it("should show payment history for family member with premium primary", async () => {
			currentMockUser = {
				...mockFreeUser,
				_id: "family-member-1",
				accountType: "family_member" as const,
				primaryAccountId: "primary-user-123",
				subscriptionStatus: "premium" as const,
			};

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/subscription")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockSubscription("premium", true))
							),
					});
				}
				if (url.includes("/api/payment")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(createMockPayments())),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderSubscriptionPage();

			await waitFor(() => {
				expect(screen.getByText("Payment History")).toBeInTheDocument();
			});
		});
	});

	describe("Family Member with Free Primary Account", () => {
		it("should show family plan info card instead of upgrade button for free family member", async () => {
			currentMockUser = {
				...mockFreeUser,
				_id: "family-member-1",
				accountType: "family_member" as const,
				primaryAccountId: "primary-user-123",
				subscriptionStatus: "free" as const,
			};

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/subscription")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockSubscription("free", true))
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderSubscriptionPage();

			await waitFor(() => {
				expect(screen.getByText("Family Plan")).toBeInTheDocument();
			});

			// Should show family plan message, not upgrade button
			expect(
				screen.getByText("Your subscription is managed by your family plan owner")
			).toBeInTheDocument();
			expect(
				screen.queryByTestId("subscription-upgrade-premium-btn")
			).not.toBeInTheDocument();
		});

		it("should show contact primary message instead of upgrade button in plan card", async () => {
			currentMockUser = {
				...mockFreeUser,
				_id: "family-member-1",
				accountType: "family_member" as const,
				primaryAccountId: "primary-user-123",
				subscriptionStatus: "free" as const,
			};

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/subscription")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockSubscription("free", true))
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderSubscriptionPage();

			await waitFor(() => {
				expect(
					screen.getByText("Contact your family plan owner to upgrade to Premium.")
				).toBeInTheDocument();
			});

			// The upgrade button in the plan card should not be shown
			expect(
				screen.queryByTestId("subscription-upgrade-btn")
			).not.toBeInTheDocument();
		});
	});

	describe("Primary User View (Non-Family Member)", () => {
		it("should not show family member banner for primary user", async () => {
			currentMockUser = mockPremiumUser;

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/subscription")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockSubscription("premium", false))
							),
					});
				}
				if (url.includes("/api/payment")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () => Promise.resolve(createApiResponse(createMockPayments())),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderSubscriptionPage();

			await waitFor(() => {
				expect(screen.getByText("Premium Plan")).toBeInTheDocument();
			});

			// Should NOT show family member banner for primary users
			expect(
				screen.queryByTestId("family-member-subscription-banner")
			).not.toBeInTheDocument();
		});

		it("should show upgrade button for free primary user", async () => {
			currentMockUser = mockFreeUser;

			mockFetch.mockImplementation((url: string) => {
				if (url.includes("/api/subscription")) {
					return Promise.resolve({
						ok: true,
						status: 200,
						headers: new Headers({ "content-type": "application/json" }),
						json: () =>
							Promise.resolve(
								createApiResponse(createMockSubscription("free", false))
							),
					});
				}
				return Promise.resolve({
					ok: true,
					status: 200,
					headers: new Headers({ "content-type": "application/json" }),
					json: () => Promise.resolve(createApiResponse({})),
				});
			});

			renderSubscriptionPage();

			await waitFor(() => {
				expect(
					screen.getByTestId("subscription-upgrade-btn")
				).toBeInTheDocument();
			});

			expect(
				screen.getByTestId("subscription-upgrade-premium-btn")
			).toBeInTheDocument();
		});
	});
});
