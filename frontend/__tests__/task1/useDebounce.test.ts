import { renderHook, act } from '@testing-library/react';

import { useDebounce } from '@/shared/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately without delay', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should NOT update value immediately when input changes - value should be debounced', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      },
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });

    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should reset timer when value changes rapidly - only final value should be returned', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: '', delay: 300 },
      },
    );

    rerender({ value: 'h', delay: 300 });
    act(() => jest.advanceTimersByTime(100));

    rerender({ value: 'he', delay: 300 });
    act(() => jest.advanceTimersByTime(100));

    rerender({ value: 'hel', delay: 300 });
    act(() => jest.advanceTimersByTime(100));

    rerender({ value: 'hell', delay: 300 });
    act(() => jest.advanceTimersByTime(100));

    rerender({ value: 'hello', delay: 300 });

    expect(result.current).toBe('');

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current).toBe('hello');
  });

  it('should cleanup timeout on unmount to prevent memory leaks', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');

    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      },
    );

    rerender({ value: 'updated', delay: 500 });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });
});
