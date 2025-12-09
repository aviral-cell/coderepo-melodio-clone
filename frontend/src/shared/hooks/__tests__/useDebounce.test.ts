/**
 * @file useDebounce.test.ts
 * @description Unit tests for the useDebounce custom hook.
 *
 * The useDebounce hook delays updating a value until a specified time has passed
 * since the last change. This is commonly used for search inputs to avoid making
 * API calls on every keystroke.
 *
 * @module shared/hooks/__tests__/useDebounce.test
 *
 * Test Coverage:
 * - Initial value return behavior
 * - Debouncing mechanism with delayed updates
 * - Timer reset on rapid value changes
 * - Default delay (300ms) behavior
 * - Support for various data types (string, number, object, array, null, undefined)
 * - Delay parameter changes
 * - Cleanup on unmount
 * - Edge cases (empty strings)
 */
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

/**
 * Test Suite: useDebounce Hook
 *
 * Tests the debouncing functionality that delays value propagation.
 * Uses Jest fake timers to control time progression for deterministic testing.
 */
describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Verifies that the hook returns the initial value without waiting for the debounce delay
  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));

    expect(result.current).toBe('initial');
  });

  // Verifies that value changes are delayed by the specified debounce time
  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    });

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 300 });

    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Now it should be updated
    expect(result.current).toBe('updated');
  });

  // Verifies that rapid consecutive changes only result in the final value being set
  it('should reset the timer on rapid value changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 300 },
    });

    // First change
    rerender({ value: 'change1', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Second change before timer completes
    rerender({ value: 'change2', delay: 300 });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Third change before timer completes
    rerender({ value: 'change3', delay: 300 });

    // Should still be initial
    expect(result.current).toBe('initial');

    // Now wait for the full delay
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Should be the last value
    expect(result.current).toBe('change3');
  });

  // Verifies that the hook uses 300ms as the default delay when none is specified
  it('should use default delay of 300ms', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    // Should not change before 300ms
    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    // Should change at 300ms
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  // Verifies that the hook correctly handles numbers, objects, and arrays
  it('should work with different data types', () => {
    // Number
    const { result: numberResult, rerender: rerenderNumber } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 0 } },
    );

    rerenderNumber({ value: 42 });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(numberResult.current).toBe(42);

    // Object
    const { result: objectResult, rerender: rerenderObject } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { name: 'initial' } } },
    );

    rerenderObject({ value: { name: 'updated' } });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(objectResult.current).toEqual({ name: 'updated' });

    // Array
    const { result: arrayResult, rerender: rerenderArray } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: [1, 2, 3] } },
    );

    rerenderArray({ value: [4, 5, 6] });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(arrayResult.current).toEqual([4, 5, 6]);
  });

  // Verifies that the hook handles null and undefined values without errors
  it('should work with null and undefined values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce<string | null | undefined>(value, 100),
      { initialProps: { value: 'initial' as string | null | undefined } },
    );

    rerender({ value: null });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBeNull();

    rerender({ value: undefined });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBeUndefined();
  });

  // Verifies that changing the delay parameter resets the debounce timer
  it('should handle delay changes', () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 200 },
    });

    rerender({ value: 'updated', delay: 500 });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Should still be initial because delay changed to 500ms
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Now it should be updated
    expect(result.current).toBe('updated');
  });

  // Verifies that pending timeouts are cleared when the component unmounts to prevent memory leaks
  it('should clean up timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'updated' });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  // Verifies that the hook correctly debounces to an empty string value
  it('should handle empty string', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 'search term' },
    });

    rerender({ value: '' });
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(result.current).toBe('');
  });
});
