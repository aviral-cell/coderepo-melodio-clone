import { formatTime, formatDuration, formatNumber, formatRelativeTime } from '../formatters';

describe('formatters', () => {
  describe('formatTime', () => {
    it('should return 0:00 for zero seconds', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    it('should return 0:00 for negative seconds', () => {
      expect(formatTime(-10)).toBe('0:00');
    });

    it('should return 0:00 for undefined/null', () => {
      expect(formatTime(undefined as unknown as number)).toBe('0:00');
      expect(formatTime(null as unknown as number)).toBe('0:00');
    });

    it('should format seconds correctly', () => {
      expect(formatTime(5)).toBe('0:05');
      expect(formatTime(30)).toBe('0:30');
      expect(formatTime(59)).toBe('0:59');
    });

    it('should format minutes and seconds correctly', () => {
      expect(formatTime(60)).toBe('1:00');
      expect(formatTime(65)).toBe('1:05');
      expect(formatTime(125)).toBe('2:05');
      expect(formatTime(180)).toBe('3:00');
      expect(formatTime(599)).toBe('9:59');
    });

    it('should format hours, minutes, and seconds correctly', () => {
      expect(formatTime(3600)).toBe('1:00:00');
      expect(formatTime(3661)).toBe('1:01:01');
      expect(formatTime(7200)).toBe('2:00:00');
      expect(formatTime(7325)).toBe('2:02:05');
    });

    it('should pad seconds with leading zero', () => {
      expect(formatTime(61)).toBe('1:01');
      expect(formatTime(3601)).toBe('1:00:01');
    });

    it('should pad minutes with leading zero in hour format', () => {
      expect(formatTime(3660)).toBe('1:01:00');
      expect(formatTime(3665)).toBe('1:01:05');
    });
  });

  describe('formatDuration', () => {
    it('should return 0 sec for zero seconds', () => {
      expect(formatDuration(0)).toBe('0 sec');
    });

    it('should return 0 sec for negative seconds', () => {
      expect(formatDuration(-10)).toBe('0 sec');
    });

    it('should return 0 sec for undefined/null', () => {
      expect(formatDuration(undefined as unknown as number)).toBe('0 sec');
      expect(formatDuration(null as unknown as number)).toBe('0 sec');
    });

    it('should format seconds only', () => {
      expect(formatDuration(5)).toBe('5 sec');
      expect(formatDuration(30)).toBe('30 sec');
      expect(formatDuration(59)).toBe('59 sec');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(60)).toBe('1 min');
      expect(formatDuration(65)).toBe('1 min 5 sec');
      expect(formatDuration(125)).toBe('2 min 5 sec');
      expect(formatDuration(180)).toBe('3 min');
    });

    it('should format hours, minutes, and seconds', () => {
      expect(formatDuration(3600)).toBe('1 hr');
      expect(formatDuration(3661)).toBe('1 hr 1 min 1 sec');
      expect(formatDuration(7200)).toBe('2 hr');
      expect(formatDuration(7325)).toBe('2 hr 2 min 5 sec');
    });

    it('should handle hours and seconds without minutes', () => {
      expect(formatDuration(3605)).toBe('1 hr 5 sec');
    });

    it('should handle hours and minutes without seconds', () => {
      expect(formatDuration(3720)).toBe('1 hr 2 min');
    });
  });

  describe('formatNumber', () => {
    it('should return number as string for small numbers', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(1)).toBe('1');
      expect(formatNumber(100)).toBe('100');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(10000)).toBe('10.0K');
      expect(formatNumber(99999)).toBe('100.0K');
      expect(formatNumber(500000)).toBe('500.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(1500000)).toBe('1.5M');
      expect(formatNumber(10000000)).toBe('10.0M');
      expect(formatNumber(100000000)).toBe('100.0M');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return Today for same day', () => {
      expect(formatRelativeTime('2024-06-15T10:00:00.000Z')).toBe('Today');
      expect(formatRelativeTime(new Date('2024-06-15T08:00:00.000Z'))).toBe('Today');
    });

    it('should return Yesterday for previous day', () => {
      expect(formatRelativeTime('2024-06-14T12:00:00.000Z')).toBe('Yesterday');
    });

    it('should return days ago for 2-6 days', () => {
      expect(formatRelativeTime('2024-06-13T12:00:00.000Z')).toBe('2 days ago');
      expect(formatRelativeTime('2024-06-10T12:00:00.000Z')).toBe('5 days ago');
      expect(formatRelativeTime('2024-06-09T12:00:00.000Z')).toBe('6 days ago');
    });

    it('should return weeks ago for 7-29 days', () => {
      expect(formatRelativeTime('2024-06-08T12:00:00.000Z')).toBe('1 weeks ago');
      expect(formatRelativeTime('2024-06-01T12:00:00.000Z')).toBe('2 weeks ago');
      expect(formatRelativeTime('2024-05-20T12:00:00.000Z')).toBe('3 weeks ago');
    });

    it('should return months ago for 30-364 days', () => {
      expect(formatRelativeTime('2024-05-15T12:00:00.000Z')).toBe('1 months ago');
      expect(formatRelativeTime('2024-03-15T12:00:00.000Z')).toBe('3 months ago');
      expect(formatRelativeTime('2023-07-15T12:00:00.000Z')).toBe('11 months ago');
    });

    it('should return years ago for 365+ days', () => {
      expect(formatRelativeTime('2023-06-15T12:00:00.000Z')).toBe('1 years ago');
      expect(formatRelativeTime('2022-06-15T12:00:00.000Z')).toBe('2 years ago');
      expect(formatRelativeTime('2021-06-15T12:00:00.000Z')).toBe('3 years ago');
    });

    it('should accept Date object', () => {
      const date = new Date('2024-06-14T12:00:00.000Z');
      expect(formatRelativeTime(date)).toBe('Yesterday');
    });
  });
});
