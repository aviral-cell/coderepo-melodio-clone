import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfill TextEncoder/TextDecoder for react-router compatibility
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Only set up browser mocks when window is defined (jsdom environment)
if (typeof window !== "undefined") {
	// Mock window.matchMedia for components that use media queries
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: jest.fn().mockImplementation((query: string) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: jest.fn(),
			removeListener: jest.fn(),
			addEventListener: jest.fn(),
			removeEventListener: jest.fn(),
			dispatchEvent: jest.fn(),
		})),
	});

	// Mock ResizeObserver as a proper class
	class MockResizeObserver {
		observe = jest.fn();
		unobserve = jest.fn();
		disconnect = jest.fn();
	}
	global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

	// Mock IntersectionObserver as a proper class
	class MockIntersectionObserver {
		observe = jest.fn();
		unobserve = jest.fn();
		disconnect = jest.fn();
		root = null;
		rootMargin = "";
		thresholds = [];
	}
	global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

// Suppress console errors during tests (optional)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
	console.error = (...args: unknown[]) => {
		// Suppress specific React warnings if needed
		if (
			typeof args[0] === "string" &&
			args[0].includes("Warning: ReactDOM.render is no longer supported")
		) {
			return;
		}
		originalError.call(console, ...args);
	};

	console.warn = (...args: unknown[]) => {
		// Suppress react-router "No routes matched" warnings in tests
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
