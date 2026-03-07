jest.mock("expo-location", () => ({
  Accuracy: {
    Low: 1,
    Balanced: 2,
    High: 3,
    BestForNavigation: 4,
  },
}));

import {
  haversineDistance,
  findNearestBuilding,
  findNearestBuildingOnCampus,
  determineMovementMode,
  getWatcherConfigForMode,
  getDistanceToPolyline,
  isOnCampus,
  formatDistance,
  sumPolylineDistance,
} from "../utils/locationUtils";
import type { Building } from "../data/buildings";

describe("locationUtils", () => {
  it("haversineDistance returns 0 for identical coordinates", () => {
    const coord = { latitude: 45.5, longitude: -73.6 };
    expect(haversineDistance(coord, coord)).toBe(0);
  });

  it("haversineDistance is symmetric and positive", () => {
    const a = { latitude: 45.5, longitude: -73.6 };
    const b = { latitude: 45.51, longitude: -73.59 };
    const ab = haversineDistance(a, b);
    const ba = haversineDistance(b, a);

    expect(ab).toBeGreaterThan(0);
    expect(Math.abs(ab - ba)).toBeLessThan(0.0001);
  });

  it("findNearestBuilding returns null when buildings list is empty", () => {
    const user = { latitude: 45.5, longitude: -73.6 };
    expect(findNearestBuilding(user, [])).toBeNull();
  });

  it("findNearestBuilding returns the closest building", () => {
    const buildings = [
      { id: "A", marker: { latitude: 45.5001, longitude: -73.6001 } },
      { id: "B", marker: { latitude: 45.7, longitude: -73.9 } },
    ] as unknown as Building[];

    const result = findNearestBuilding(
      { latitude: 45.5, longitude: -73.6 },
      buildings,
    );

    expect(result).not.toBeNull();
    expect(result?.building.id).toBe("A");
    expect(result?.distance).toBeGreaterThan(0);
  });

  it("findNearestBuildingOnCampus filters to SGW/LOYOLA campus sets", () => {
    const nearSGW = { latitude: 45.4973, longitude: -73.579 };
    const nearLoyola = { latitude: 45.4582, longitude: -73.6405 };

    const sgw = findNearestBuildingOnCampus(nearSGW, "SGW");
    const loyola = findNearestBuildingOnCampus(nearLoyola, "LOYOLA");

    expect(sgw).not.toBeNull();
    expect(loyola).not.toBeNull();
    expect(["FB", "EV", "LB", "H", "CL", "MB", "LS", "ER"]).toContain(
      sgw?.building.id,
    );
    expect(["VL", "HU", "SP", "AD", "CC", "SC", "HB", "VE"]).toContain(
      loyola?.building.id,
    );
  });

  it("determineMovementMode returns expected mode at speed boundaries", () => {
    expect(determineMovementMode(0)).toBe("idle");
    expect(determineMovementMode(0.56)).toBe("walking");
    expect(determineMovementMode(2.23)).toBe("biking");
    expect(determineMovementMode(8.34)).toBe("transit");
  });

  it("getWatcherConfigForMode prioritizes navigation mode", () => {
    const config = getWatcherConfigForMode("idle", true);
    expect(config).toEqual({
      accuracy: 4,
      timeInterval: 1000,
      distanceInterval: 3,
    });
  });

  it("getWatcherConfigForMode returns mode-specific config and fallback", () => {
    expect(getWatcherConfigForMode("idle", false)).toEqual({
      accuracy: 1,
      timeInterval: 15000,
      distanceInterval: 25,
    });
    expect(getWatcherConfigForMode("walking", false)).toEqual({
      accuracy: 3,
      timeInterval: 3000,
      distanceInterval: 5,
    });
    expect(getWatcherConfigForMode("biking", false)).toEqual({
      accuracy: 3,
      timeInterval: 2000,
      distanceInterval: 10,
    });
    expect(getWatcherConfigForMode("transit", false)).toEqual({
      accuracy: 2,
      timeInterval: 5000,
      distanceInterval: 50,
    });

    expect(getWatcherConfigForMode("unknown" as any, false)).toEqual({
      accuracy: 1,
      timeInterval: 15000,
      distanceInterval: 25,
    });
  });

  it("getDistanceToPolyline returns Infinity for empty list and closest point distance otherwise", () => {
    const user = { latitude: 45.5, longitude: -73.6 };

    expect(getDistanceToPolyline(user, [])).toBe(Infinity);

    const distance = getDistanceToPolyline(user, [
      { latitude: 45.52, longitude: -73.62 },
      { latitude: 45.5002, longitude: -73.6002 },
    ]);

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(100);
  });

  it("isOnCampus detects SGW, LOYOLA, and off-campus", () => {
    expect(isOnCampus({ latitude: 45.4973, longitude: -73.579 })).toEqual({
      onCampus: true,
      campus: "SGW",
    });

    expect(isOnCampus({ latitude: 45.4582, longitude: -73.6405 })).toEqual({
      onCampus: true,
      campus: "LOYOLA",
    });

    expect(isOnCampus({ latitude: 46, longitude: -74 })).toEqual({
      onCampus: false,
      campus: null,
    });
  });

  it("formatDistance formats meters and kilometers", () => {
    expect(formatDistance(425)).toBe("425 m");
    expect(formatDistance(1499)).toBe("1.5 km");
  });

  it("sumPolylineDistance accumulates segment distances", () => {
    const coords = [
      { latitude: 45.5, longitude: -73.6 },
      { latitude: 45.5005, longitude: -73.6005 },
      { latitude: 45.501, longitude: -73.601 },
    ];

    expect(sumPolylineDistance([])).toBe(0);
    expect(sumPolylineDistance([coords[0]])).toBe(0);

    const total = sumPolylineDistance(coords);
    expect(total).toBeGreaterThan(100);
  });
});
