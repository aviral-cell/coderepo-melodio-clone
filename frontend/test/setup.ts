import { cleanup } from "@testing-library/react";
import { vi } from "vitest";

afterEach(() => {
	cleanup();
});

beforeAll(() => {
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
	vi.spyOn(console, "error").mockImplementation(() => {});
	vi.spyOn(console, "info").mockImplementation(() => {});
	vi.spyOn(console, "debug").mockImplementation(() => {});
});

afterAll(() => {
	vi.restoreAllMocks();
});
