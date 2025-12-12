/**
 * @jest-environment jsdom
 */

/**
 * INTRO: useToast Hook Tests
 *
 * Tests for the useToast hook which provides toast notification functionality.
 *
 * SCENARIO: Testing toast creation, removal, and auto-dismiss
 * EXPECTATION: Toasts are correctly managed with proper lifecycle
 */

import { renderHook, act } from "@testing-library/react";
import { useToast, ToastProvider } from "@/shared/hooks/useToast";
import type { ReactNode } from "react";

const wrapper = ({ children }: { children: ReactNode }) => (
	<ToastProvider>{children}</ToastProvider>
);

describe("useToast", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		act(() => {
			jest.runOnlyPendingTimers();
		});
		jest.useRealTimers();
	});

	describe("addToast", () => {
		it("should add a toast to the list", () => {
			const { result } = renderHook(() => useToast(), { wrapper });

			act(() => {
				result.current.addToast({
					message: "Test toast",
					type: "info",
				});
			});

			expect(result.current.toasts).toHaveLength(1);
			expect(result.current.toasts[0].message).toBe("Test toast");
			expect(result.current.toasts[0].type).toBe("info");
		});

		it("should generate unique ids for toasts", () => {
			const { result } = renderHook(() => useToast(), { wrapper });

			act(() => {
				result.current.addToast({ message: "Toast 1", type: "info" });
				result.current.addToast({ message: "Toast 2", type: "info" });
			});

			expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id);
		});

		it("should support different toast types", () => {
			const { result } = renderHook(() => useToast(), { wrapper });

			act(() => {
				result.current.addToast({ message: "Success", type: "success" });
				result.current.addToast({ message: "Error", type: "error" });
				result.current.addToast({ message: "Warning", type: "warning" });
				result.current.addToast({ message: "Info", type: "info" });
			});

			expect(result.current.toasts[0].type).toBe("success");
			expect(result.current.toasts[1].type).toBe("error");
			expect(result.current.toasts[2].type).toBe("warning");
			expect(result.current.toasts[3].type).toBe("info");
		});
	});

	describe("removeToast", () => {
		it("should remove a toast by id", () => {
			const { result } = renderHook(() => useToast(), { wrapper });

			let toastId: string;
			act(() => {
				toastId = result.current.addToast({ message: "Test", type: "info" });
			});

			expect(result.current.toasts).toHaveLength(1);

			act(() => {
				result.current.removeToast(toastId!);
			});

			expect(result.current.toasts).toHaveLength(0);
		});

		it("should only remove the specified toast", () => {
			const { result } = renderHook(() => useToast(), { wrapper });

			let toastId: string;
			act(() => {
				result.current.addToast({ message: "Toast 1", type: "info" });
				toastId = result.current.addToast({ message: "Toast 2", type: "info" });
				result.current.addToast({ message: "Toast 3", type: "info" });
			});

			act(() => {
				result.current.removeToast(toastId!);
			});

			expect(result.current.toasts).toHaveLength(2);
			expect(result.current.toasts.find((t) => t.id === toastId)).toBeUndefined();
		});
	});

	describe("Auto-dismiss", () => {
		it("should auto-dismiss toasts after duration", () => {
			const { result } = renderHook(() => useToast(), { wrapper });

			act(() => {
				result.current.addToast({
					message: "Test",
					type: "info",
					duration: 3000,
				});
			});

			expect(result.current.toasts).toHaveLength(1);

			act(() => {
				jest.advanceTimersByTime(3000);
			});

			expect(result.current.toasts).toHaveLength(0);
		});

		it("should use default duration if not specified", () => {
			const { result } = renderHook(() => useToast(), { wrapper });

			act(() => {
				result.current.addToast({ message: "Test", type: "info" });
			});

			expect(result.current.toasts).toHaveLength(1);

			act(() => {
				jest.advanceTimersByTime(5000);
			});

			expect(result.current.toasts).toHaveLength(0);
		});
	});

	describe("Error handling", () => {
		it("should throw when used outside ToastProvider", () => {
			const consoleError = jest
				.spyOn(console, "error")
				.mockImplementation(() => {});

			expect(() => {
				renderHook(() => useToast());
			}).toThrow("useToast must be used within a ToastProvider");

			consoleError.mockRestore();
		});
	});
});
