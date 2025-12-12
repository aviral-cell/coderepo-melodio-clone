/**
 * @jest-environment jsdom
 */

/**
 * INTRO: useLocalStorage Hook Tests
 *
 * Tests for the useLocalStorage hook which persists state to localStorage.
 *
 * SCENARIO: Testing state persistence across page reloads and cross-tab sync
 * EXPECTATION: Values are correctly stored, retrieved, and synchronized
 */

import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/shared/hooks/useLocalStorage";

describe("useLocalStorage", () => {
	beforeEach(() => {
		localStorage.clear();
		jest.clearAllMocks();
	});

	describe("Initial State", () => {
		it("should return initial value when localStorage is empty", () => {
			const { result } = renderHook(() =>
				useLocalStorage("test-key", "default")
			);

			expect(result.current[0]).toBe("default");
		});

		it("should return stored value when localStorage has data", () => {
			localStorage.setItem("test-key", JSON.stringify("stored-value"));

			const { result } = renderHook(() =>
				useLocalStorage("test-key", "default")
			);

			expect(result.current[0]).toBe("stored-value");
		});

		it("should handle object values from localStorage", () => {
			const storedObject = { name: "test", count: 42 };
			localStorage.setItem("test-key", JSON.stringify(storedObject));

			const { result } = renderHook(() =>
				useLocalStorage("test-key", { name: "default", count: 0 })
			);

			expect(result.current[0]).toEqual(storedObject);
		});

		it("should handle array values from localStorage", () => {
			const storedArray = [1, 2, 3];
			localStorage.setItem("test-key", JSON.stringify(storedArray));

			const { result } = renderHook(() => useLocalStorage<number[]>("test-key", []));

			expect(result.current[0]).toEqual(storedArray);
		});
	});

	describe("setValue", () => {
		it("should update state and localStorage", () => {
			const { result } = renderHook(() =>
				useLocalStorage("test-key", "initial")
			);

			act(() => {
				result.current[1]("updated");
			});

			expect(result.current[0]).toBe("updated");
			expect(JSON.parse(localStorage.getItem("test-key") || "")).toBe("updated");
		});

		it("should handle function updater", () => {
			const { result } = renderHook(() => useLocalStorage("test-key", 0));

			act(() => {
				result.current[1]((prev) => prev + 1);
			});

			expect(result.current[0]).toBe(1);

			act(() => {
				result.current[1]((prev) => prev + 5);
			});

			expect(result.current[0]).toBe(6);
		});

		it("should handle object updates", () => {
			const { result } = renderHook(() =>
				useLocalStorage("test-key", { count: 0 })
			);

			act(() => {
				result.current[1]({ count: 10 });
			});

			expect(result.current[0]).toEqual({ count: 10 });
			expect(JSON.parse(localStorage.getItem("test-key") || "")).toEqual({
				count: 10,
			});
		});
	});

	describe("Error Handling", () => {
		it("should return initial value when localStorage has invalid JSON", () => {
			localStorage.setItem("test-key", "invalid-json{");

			const { result } = renderHook(() =>
				useLocalStorage("test-key", "default")
			);

			expect(result.current[0]).toBe("default");
		});

		it("should handle localStorage getItem throwing", () => {
			const originalGetItem = Storage.prototype.getItem;
			Storage.prototype.getItem = jest.fn(() => {
				throw new Error("QuotaExceeded");
			});

			const { result } = renderHook(() =>
				useLocalStorage("test-key", "fallback")
			);

			expect(result.current[0]).toBe("fallback");

			Storage.prototype.getItem = originalGetItem;
		});

		it("should handle localStorage setItem throwing", () => {
			const originalSetItem = Storage.prototype.setItem;
			Storage.prototype.setItem = jest.fn(() => {
				throw new Error("QuotaExceeded");
			});

			const { result } = renderHook(() =>
				useLocalStorage("test-key", "initial")
			);

			act(() => {
				result.current[1]("new-value");
			});

			expect(result.current[0]).toBe("new-value");

			Storage.prototype.setItem = originalSetItem;
		});
	});

	describe("Cross-tab Synchronization", () => {
		it("should update state when storage event fires", () => {
			const { result } = renderHook(() =>
				useLocalStorage("test-key", "initial")
			);

			expect(result.current[0]).toBe("initial");

			act(() => {
				const event = new StorageEvent("storage", {
					key: "test-key",
					newValue: JSON.stringify("from-other-tab"),
					storageArea: localStorage,
				});
				window.dispatchEvent(event);
			});

			expect(result.current[0]).toBe("from-other-tab");
		});

		it("should ignore storage events for different keys", () => {
			const { result } = renderHook(() =>
				useLocalStorage("my-key", "initial")
			);

			act(() => {
				const event = new StorageEvent("storage", {
					key: "other-key",
					newValue: JSON.stringify("other-value"),
					storageArea: localStorage,
				});
				window.dispatchEvent(event);
			});

			expect(result.current[0]).toBe("initial");
		});

		it("should reset to initial value when storage is cleared", () => {
			localStorage.setItem("test-key", JSON.stringify("stored"));

			const { result } = renderHook(() =>
				useLocalStorage("test-key", "default")
			);

			expect(result.current[0]).toBe("stored");

			act(() => {
				const event = new StorageEvent("storage", {
					key: "test-key",
					newValue: null,
					storageArea: localStorage,
				});
				window.dispatchEvent(event);
			});

			expect(result.current[0]).toBe("default");
		});
	});

	describe("Cleanup", () => {
		it("should remove storage event listener on unmount", () => {
			const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

			const { unmount } = renderHook(() =>
				useLocalStorage("test-key", "initial")
			);

			unmount();

			expect(removeEventListenerSpy).toHaveBeenCalledWith(
				"storage",
				expect.any(Function)
			);

			removeEventListenerSpy.mockRestore();
		});
	});
});
