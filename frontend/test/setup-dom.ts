import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

expect.extend(matchers);
import { vi } from "vitest";
import { TextEncoder, TextDecoder } from "node:util";

Object.defineProperty(globalThis, "TextEncoder", {
	configurable: true,
	writable: true,
	value: TextEncoder,
});

Object.defineProperty(globalThis, "TextDecoder", {
	configurable: true,
	writable: true,
	value: TextDecoder,
});

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
	Object.defineProperty(globalThis, "ResizeObserver", {
		configurable: true,
		writable: true,
		value: MockResizeObserver,
	});

	class MockIntersectionObserver {
		observe = vi.fn();
		unobserve = vi.fn();
		disconnect = vi.fn();
		root = null;
		rootMargin = "";
		thresholds: number[] = [];
	}
	Object.defineProperty(globalThis, "IntersectionObserver", {
		configurable: true,
		writable: true,
		value: MockIntersectionObserver,
	});
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
