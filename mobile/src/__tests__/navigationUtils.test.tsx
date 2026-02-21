import { calculateETA } from "../utils/navigationUtils";

describe('calculateETA', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Feb 15, 2026 12:00:00
    jest.setSystemTime(new Date(2026, 1, 15, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('adds minutes correctly', () => {
    const result = calculateETA('15 mins');
    expect(result).toBe('12:15');
  });

  it('adds hours and minutes correctly', () => {
    const result = calculateETA('1 hour 30 mins');
    expect(result).toBe('13:30');
  });

  it('handles plural hours and different casing', () => {
    const result = calculateETA('2 HOURS');
    expect(result).toBe('14:00');
  });

  it('handles single hour only', () => {
    const result = calculateETA('1 hour');
    expect(result).toBe('13:00');
  });

  it('returns --:-- for N/A', () => {
    const result = calculateETA('N/A');
    expect(result).toBe('--:--');
  });

  it('returns --:-- for empty string', () => {
    const result = calculateETA('');
    expect(result).toBe('--:--');
  });

  it('returns --:-- if total minutes parsed is 0', () => {
    const result = calculateETA('0 mins');
    expect(result).toBe('--:--');
  });

  it('handles minute overflow correctly', () => {
    const result = calculateETA('120 mins');
    expect(result).toBe('14:00'); // 12:00 + 2 hours
  });
});