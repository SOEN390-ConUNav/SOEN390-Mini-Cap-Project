import { calculateDistance, getOpenStatusText } from "../utils/location";

describe("calculateDistance", () => {
  it("returns 0 for identical coordinates", () => {
    const result = calculateDistance(45.5017, -73.5673, 45.5017, -73.5673);
    expect(result).toBeCloseTo(0, 5);
  });

  it("calculates correct distance between two known points", () => {
    // Montreal to Toronto approx 504 km
    const montreal = { lat: 45.5017, lon: -73.5673 };
    const toronto = { lat: 43.6532, lon: -79.3832 };

    const result = calculateDistance(
      montreal.lat,
      montreal.lon,
      toronto.lat,
      toronto.lon
    );

    // Expect around 504,000 meters ± 10km
    expect(result).toBeGreaterThan(490000);
    expect(result).toBeLessThan(520000);
  });

  it("is symmetric (distance A→B equals B→A)", () => {
    const d1 = calculateDistance(45, -73, 46, -74);
    const d2 = calculateDistance(46, -74, 45, -73);

    expect(d1).toBeCloseTo(d2, 5);
  });
});

describe("getOpenStatusText", () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("returns empty string if openingHours is undefined", () => {
    expect(getOpenStatusText(undefined)).toBe("");
  });

  it("returns empty string if no periods exist", () => {
    expect(getOpenStatusText({ openNow: true })).toBe("");
  });

  it("returns 'Closes at ...' when open", () => {
    // Mock date to Monday
    const mockDate = new Date("2024-07-01T12:00:00"); // Monday
    jest.setSystemTime(mockDate);

    const openingHours = {
      openNow: true,
      periods: [
        {
          open: { day: 0, hour: 9, minute: 0 },   // Monday
          close: { day: 0, hour: 18, minute: 0 },
        },
      ],
    };

    const result = getOpenStatusText(openingHours);

    expect(result).toMatch(/Closes at/);
    expect(result).toMatch(/6:00/);
  });

  it("returns 'Opens at ...' when closed", () => {
    const mockDate = new Date("2024-07-01T06:00:00"); // Monday early morning
    jest.setSystemTime(mockDate);

    const openingHours = {
      openNow: false,
      periods: [
        {
          open: { day: 0, hour: 9, minute: 0 },
          close: { day: 0, hour: 18, minute: 0 },
        },
      ],
    };

    const result = getOpenStatusText(openingHours);

    expect(result).toMatch(/Opens at/);
    expect(result).toMatch(/9:00/);
  });

  it("returns empty string if no period matches today", () => {
    const mockDate = new Date("2024-07-01T12:00:00"); // Monday
    jest.setSystemTime(mockDate);

    const openingHours = {
      openNow: true,
      periods: [
        {
          open: { day: 2, hour: 9, minute: 0 }, // Wednesday only
          close: { day: 2, hour: 18, minute: 0 },
        },
      ],
    };

    const result = getOpenStatusText(openingHours);

    expect(result).toBe("");
  });

  it("returns empty string if open but no close time", () => {
    const mockDate = new Date("2024-07-01T12:00:00");
    jest.setSystemTime(mockDate);

    const openingHours = {
      openNow: true,
      periods: [
        {
          open: { day: 0, hour: 9, minute: 0 },
        },
      ],
    };

    const result = getOpenStatusText(openingHours);

    expect(result).toBe("");
  });
});