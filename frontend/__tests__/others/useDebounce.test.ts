/**
 * @jest-environment jsdom
 */

/**
 * INTRO: useDebounce Hook Tests
 *
 * Tests for the useDebounce hook which delays value updates by a specified time.
 *
 * SCENARIO: Testing debounce behavior with various timing scenarios
 * EXPECTATION: Value updates are delayed until after the specified delay period
 */

import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "@/shared/hooks/useDebounce";

describe("useDebounce", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.runOnlyPendingTimers();
		jest.useRealTimers();
	});

	describe("Initial Value", () => {
		it("should return initial value immediately", () => {
			const { result } = renderHook(() => useDebounce("hello", 300));

			expect(result.current).toBe("hello");
		});
	});

	describe("Delayed Updates", () => {
		it("should delay value updates", () => {
			const { result, rerender } = renderHook(
				({ value, delay }) => useDebounce(value, delay),
				{
					initialProps: { value: "hello", delay: 300 },
				}
			);

			expect(result.current).toBe("hello");

			rerender({ value: "world", delay: 300 });

			expect(result.current).toBe("hello");

			act(() => {
				jest.advanceTimersByTime(299);
			});
			expect(result.current).toBe("hello");

			act(() => {
				jest.advanceTimersByTime(1);
			});
			expect(result.current).toBe("world");
		});

		it("should reset timer on rapid changes", () => {
			const { result, rerender } = renderHook(
				({ value, delay }) => useDebounce(value, delay),
				{
					initialProps: { value: "A", delay: 300 },
				}
			);

			expect(result.current).toBe("A");

			rerender({ value: "B", delay: 300 });
			act(() => {
				jest.advanceTimersByTime(100);
			});
			expect(result.current).toBe("A");

			rerender({ value: "C", delay: 300 });
			act(() => {
				jest.advanceTimersByTime(100);
			});
			expect(result.current).toBe("A");

			rerender({ value: "D", delay: 300 });
			act(() => {
				jest.advanceTimersByTime(299);
			});
			expect(result.current).toBe("A");

			act(() => {
				jest.advanceTimersByTime(1);
			});
			expect(result.current).toBe("D");
		});
	});

	describe("Edge Cases", () => {
		it("should handle zero delay", () => {
			const { result, rerender } = renderHook(
				({ value, delay }) => useDebounce(value, delay),
				{
					initialProps: { value: "initial", delay: 0 },
				}
			);

			rerender({ value: "updated", delay: 0 });

			act(() => {
				jest.advanceTimersByTime(0);
			});

			expect(result.current).toBe("updated");
		});

		it("should work with different types", () => {
			const { result, rerender } = renderHook(
				({ value, delay }) => useDebounce(value, delay),
				{
					initialProps: { value: 42, delay: 100 },
				}
			);

			expect(result.current).toBe(42);

			rerender({ value: 100, delay: 100 });

			act(() => {
				jest.advanceTimersByTime(100);
			});

			expect(result.current).toBe(100);
		});

		it("should work with objects", () => {
			const initialObj = { name: "test" };
			const updatedObj = { name: "updated" };

			const { result, rerender } = renderHook(
				({ value, delay }) => useDebounce(value, delay),
				{
					initialProps: { value: initialObj, delay: 200 },
				}
			);

			expect(result.current).toBe(initialObj);

			rerender({ value: updatedObj, delay: 200 });

			act(() => {
				jest.advanceTimersByTime(200);
			});

			expect(result.current).toBe(updatedObj);
		});

		it("should cleanup timeout on unmount", () => {
			const { unmount, rerender } = renderHook(
				({ value, delay }) => useDebounce(value, delay),
				{
					initialProps: { value: "initial", delay: 300 },
				}
			);

			rerender({ value: "updated", delay: 300 });

			const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

			unmount();

			expect(clearTimeoutSpy).toHaveBeenCalled();

			clearTimeoutSpy.mockRestore();
		});
	});
});
