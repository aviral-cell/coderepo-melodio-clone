import { renderHook, act } from '@testing-library/react';

import { useDebounce } from '../useDebounce';

/**
 * ============================================================================
 * DEBOUNCE HOOK - Search Input Optimization
 * ============================================================================
 *
 * SCENARIO:
 * User types "hello" in a search box. The search should wait for the user to
 * stop typing before making an API call.
 *
 * BUG BEHAVIOR:
 * Each keystroke triggers a search API call: "h", "he", "hel", "hell", "hello".
 * This causes 5 API calls instead of 1, overwhelming the server and causing
 * the loading spinner to flash repeatedly.
 *
 * EXPECTATION:
 * The debounced value should only update after the specified delay has passed
 * since the last change. Only the final value ("hello") should trigger an
 * API call.
 * ============================================================================
 */
describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately without delay', () => {
    // When the hook is first called, it should return the initial value right away
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should NOT update value immediately when input changes - value should be debounced', () => {
    // SCENARIO: User types a new search query
    // The debounced value should NOT update until the delay has passed
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      },
    );

    // Initial value is returned immediately
    expect(result.current).toBe('initial');

    // User types new value - simulates user typing in search box
    rerender({ value: 'updated', delay: 500 });

    // CRITICAL: Value should NOT change immediately!
    // This is the essence of debouncing - wait for user to stop typing
    expect(result.current).toBe('initial');

    // After the delay passes (500ms), value should update
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // NOW the value should be updated
    expect(result.current).toBe('updated');
  });

  it('should reset timer when value changes rapidly - only final value should be returned', () => {
    // SCENARIO: User types "hello" quickly: h -> he -> hel -> hell -> hello
    // Only "hello" should be the final debounced value after delay
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: '', delay: 300 },
      },
    );

    // Simulate rapid typing
    rerender({ value: 'h', delay: 300 });
    act(() => jest.advanceTimersByTime(100)); // 100ms passed

    rerender({ value: 'he', delay: 300 });
    act(() => jest.advanceTimersByTime(100)); // 200ms total

    rerender({ value: 'hel', delay: 300 });
    act(() => jest.advanceTimersByTime(100)); // 300ms total

    rerender({ value: 'hell', delay: 300 });
    act(() => jest.advanceTimersByTime(100)); // 400ms total

    rerender({ value: 'hello', delay: 300 });

    // Value should still be empty string (initial value)
    // because timer keeps resetting with each keystroke
    expect(result.current).toBe('');

    // Wait for full debounce delay after last keystroke
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // NOW we should get the final value
    expect(result.current).toBe('hello');
  });
});
