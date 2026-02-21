import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

if (typeof window !== "undefined") {
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

	class MockResizeObserver {
		observe = jest.fn();
		unobserve = jest.fn();
		disconnect = jest.fn();
	}
	global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

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
