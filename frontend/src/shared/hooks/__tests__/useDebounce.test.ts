import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));

    expect(result.current).toBe('initial');
  });

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
