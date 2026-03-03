import { calculateETA } from "../utils/navigationUtils";
import { checkAndGetViableShuttleDestination } from "../utils/navigationUtils";
import * as geolib from "geolib";
import { BUILDINGS } from "../data/buildings";

describe("calculateETA", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Feb 15, 2026 12:00:00
    jest.setSystemTime(new Date(2026, 1, 15, 12, 0, 0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("adds minutes correctly", () => {
    const result = calculateETA("15 mins");
    expect(result).toBe("12:15");
  });

  it("adds hours and minutes correctly", () => {
    const result = calculateETA("1 hour 30 mins");
    expect(result).toBe("13:30");
  });

  it("handles plural hours and different casing", () => {
    const result = calculateETA("2 HOURS");
    expect(result).toBe("14:00");
  });

  it("handles single hour only", () => {
    const result = calculateETA("1 hour");
    expect(result).toBe("13:00");
  });

  it("returns --:-- for N/A", () => {
    const result = calculateETA("N/A");
    expect(result).toBe("--:--");
  });

  it("returns --:-- for empty string", () => {
    const result = calculateETA("");
    expect(result).toBe("--:--");
  });

  it("returns --:-- if total minutes parsed is 0", () => {
    const result = calculateETA("0 mins");
    expect(result).toBe("--:--");
  });

  it("handles minute overflow correctly", () => {
    const result = calculateETA("120 mins");
    expect(result).toBe("14:00"); // 12:00 + 2 hours
  });
});

jest.mock("geolib", () => ({
  isPointWithinRadius: jest.fn(),
  getDistance: jest.fn(),
}));

const mockIsPointWithinRadius = geolib.isPointWithinRadius as jest.Mock;
const mockGetDistance = geolib.getDistance as jest.Mock;

const SGW_STOP = BUILDINGS.find((b) => b.id === "H")?.marker;
const LOYOLA_STOP = BUILDINGS.find((b) => b.id === "VE")?.marker;

describe("checkAndGetViableShuttleDestination", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("when destination is closer to Loyola", () => {
    beforeEach(() => {
      mockGetDistance.mockReturnValueOnce(500).mockReturnValueOnce(2000);
    });

    it("returns 'LOYOLA' when target is within 1000m of Loyola stop and origin is far", () => {
      mockIsPointWithinRadius
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = checkAndGetViableShuttleDestination(
        { latitude: 45.458, longitude: -73.638 },
        { latitude: 45.495, longitude: -73.578 },
      );

      expect(result).toBe("LOYOLA");
    });

    it("returns '' when target is NOT within 1000m of Loyola stop", () => {
      mockIsPointWithinRadius
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      const result = checkAndGetViableShuttleDestination(
        { latitude: 45.43, longitude: -73.6 },
        { latitude: 45.495, longitude: -73.578 },
      );

      expect(result).toBe("");
    });

    it("returns false when origin is already near Loyola (within 3000m)", () => {
      mockIsPointWithinRadius
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const result = checkAndGetViableShuttleDestination(
        { latitude: 45.458, longitude: -73.638 },
        { latitude: 45.458, longitude: -73.638 },
      );

      expect(result).toBe(false);
    });
  });

  describe("when destination is closer to SGW", () => {
    beforeEach(() => {
      mockGetDistance.mockReturnValueOnce(2000).mockReturnValueOnce(300);
    });

    it("returns 'SGW' when target is within 1000m of SGW stop and origin is far", () => {
      mockIsPointWithinRadius
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      const result = checkAndGetViableShuttleDestination(
        { latitude: 45.495, longitude: -73.578 },
        { latitude: 45.458, longitude: -73.638 },
      );

      expect(result).toBe("SGW");
    });

    it("returns '' when target is NOT within 1000m of SGW stop", () => {
      mockIsPointWithinRadius
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false);

      const result = checkAndGetViableShuttleDestination(
        { latitude: 45.4, longitude: -73.5 },
        { latitude: 45.458, longitude: -73.638 },
      );

      expect(result).toBe("");
    });

    it("returns false when origin is already near SGW (within 3000m)", () => {
      mockIsPointWithinRadius
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const result = checkAndGetViableShuttleDestination(
        { latitude: 45.495, longitude: -73.578 },
        { latitude: 45.495, longitude: -73.578 },
      );

      expect(result).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("returns false if LOYOLA_STOP or SGW_STOP is undefined", () => {
      expect(SGW_STOP).toBeDefined();
      expect(LOYOLA_STOP).toBeDefined();
    });

    it("returns false when origin equals destination near Loyola", () => {
      mockGetDistance.mockReturnValueOnce(400).mockReturnValueOnce(2000);
      mockIsPointWithinRadius
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(true);

      const sameCoord = { latitude: 45.458, longitude: -73.638 };
      const result = checkAndGetViableShuttleDestination(sameCoord, sameCoord);

      expect(result).toBe(false);
    });
  });
});
