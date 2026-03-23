import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);
import { vi } from "vitest";
import { TextEncoder, TextDecoder } from "node:util";

(globalThis as typeof globalThis & { TextEncoder: typeof TextEncoder }).TextEncoder =
	TextEncoder;
(globalThis as typeof globalThis & { TextDecoder: typeof TextDecoder }).TextDecoder =
	TextDecoder as typeof globalThis extends { TextDecoder: infer T } ? T : typeof TextDecoder;

if (typeof window !== "undefined") {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: vi.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	});

	class MockResizeObserver {
		observe = vi.fn();
		unobserve = vi.fn();
		disconnect = vi.fn();
	}
	(globalThis as typeof globalThis & { ResizeObserver: typeof MockResizeObserver }).ResizeObserver =
		MockResizeObserver as unknown as typeof ResizeObserver;

	class MockIntersectionObserver {
		observe = vi.fn();
		unobserve = vi.fn();
		disconnect = vi.fn();
		root = null;
		rootMargin = "";
		thresholds: number[] = [];
	}
	(globalThis as typeof globalThis & {
		IntersectionObserver: typeof MockIntersectionObserver;
	}).IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
	console.error = (...args: unknown[]) => {
		if (
			typeof args[0] === "string" &&
			args[0].includes("Warning: ReactDOM.render is no longer supported")
		) {
			return;
		}
		originalError.call(console, ...args);
	};

	console.warn = (...args: unknown[]) => {
		if (
			typeof args[0] === "string" &&
			args[0].includes("No routes matched location")
		) {
			return;
		}
		originalWarn.call(console, ...args);
	};
});

afterAll(() => {
	console.error = originalError;
	console.warn = originalWarn;
});
