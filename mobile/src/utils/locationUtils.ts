import * as Location from "expo-location";
import { Building, BUILDINGS } from "../data/buildings";
import { Coordinate } from "../type";
import { MovementMode } from "../hooks/useLocationStore";

const EARTH_RADIUS_METERS = 6371000;

export function haversineDistance(
  coord1: Coordinate,
  coord2: Coordinate,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.latitude)) *
      Math.cos(toRad(coord2.latitude)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

export interface NearestBuildingResult {
  building: Building;
  distance: number;
}

export function findNearestBuilding(
  userLocation: Coordinate,
  buildings: Building[] = BUILDINGS,
): NearestBuildingResult | null {
  if (!buildings.length) return null;

  let nearest: NearestBuildingResult | null = null;

  for (const building of buildings) {
    const distance = haversineDistance(userLocation, building.marker);
    if (!nearest || distance < nearest.distance) {
      nearest = { building, distance };
    }
  }

  return nearest;
}

export function findNearestBuildingOnCampus(
  userLocation: Coordinate,
  campus: "SGW" | "LOYOLA",
): NearestBuildingResult | null {
  const sgwBuildingIds = new Set([
    "FB",
    "EV",
    "LB",
    "H",
    "CL",
    "MB",
    "LS",
    "ER",
  ]);
  const loyolaBuildingIds = new Set([
    "VL",
    "HU",
    "SP",
    "AD",
    "CC",
    "SC",
    "HB",
    "VE",
  ]);

  const campusBuildings = BUILDINGS.filter((b) =>
    campus === "SGW" ? sgwBuildingIds.has(b.id) : loyolaBuildingIds.has(b.id),
  );

  return findNearestBuilding(userLocation, campusBuildings);
}

export function determineMovementMode(
  speedMetersPerSecond: number,
): MovementMode {
  const speedKmh = speedMetersPerSecond * 3.6;

  if (speedKmh < 2) return "idle";
  if (speedKmh < 8) return "walking";
  if (speedKmh < 30) return "biking";
  return "transit";
}

export interface LocationWatcherConfig {
  accuracy: Location.Accuracy;
  timeInterval: number;
  distanceInterval: number;
}

export interface WatcherStrategy {
  getConfig(): LocationWatcherConfig;
}

class StaticWatcherStrategy implements WatcherStrategy {
  constructor(private readonly config: LocationWatcherConfig) {}

  getConfig(): LocationWatcherConfig {
    return this.config;
  }
}

const watcherStrategies: Record<MovementMode | "navigating", WatcherStrategy> =
  {
    navigating: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 3,
    }),
    idle: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.Low,
      timeInterval: 15000,
      distanceInterval: 25,
    }),
    walking: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.High,
      timeInterval: 3000,
      distanceInterval: 5,
    }),
    biking: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.High,
      timeInterval: 2000,
      distanceInterval: 10,
    }),
    transit: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
      distanceInterval: 50,
    }),
  };

export function getWatcherStrategy(
  mode: MovementMode,
  isNavigating: boolean,
): WatcherStrategy {
  if (isNavigating) return watcherStrategies.navigating;
  return watcherStrategies[mode] ?? watcherStrategies.idle;
}

export function getWatcherConfigForMode(
  mode: MovementMode,
  isNavigating: boolean,
): LocationWatcherConfig {
  return getWatcherStrategy(mode, isNavigating).getConfig();
}

export function getDistanceToPolyline(
  userLocation: Coordinate,
  polylineCoords: Coordinate[],
): number {
  if (!polylineCoords.length) return Infinity;

  let minDistance = Infinity;

  for (const point of polylineCoords) {
    const distance = haversineDistance(userLocation, point);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

export function isOnCampus(
  userLocation: Coordinate,
  thresholdMeters: number = 500,
): { onCampus: boolean; campus: "SGW" | "LOYOLA" | null } {
  const SGW_CENTER = { latitude: 45.4973, longitude: -73.579 };
  const LOYOLA_CENTER = { latitude: 45.4582, longitude: -73.6405 };

  const distToSGW = haversineDistance(userLocation, SGW_CENTER);
  const distToLoyola = haversineDistance(userLocation, LOYOLA_CENTER);

  if (distToSGW < thresholdMeters) {
    return { onCampus: true, campus: "SGW" };
  }
  if (distToLoyola < thresholdMeters) {
    return { onCampus: true, campus: "LOYOLA" };
  }

  return { onCampus: false, campus: null };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function sumPolylineDistance(coords: Coordinate[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineDistance(coords[i - 1], coords[i]);
  }
  return total;
}
