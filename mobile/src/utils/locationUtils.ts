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

type XYPoint = { x: number; y: number };

function toLocalMeters(origin: Coordinate, point: Coordinate): XYPoint {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const meanLat = toRad((origin.latitude + point.latitude) / 2);
  const x =
    toRad(point.longitude - origin.longitude) *
    EARTH_RADIUS_METERS *
    Math.cos(meanLat);
  const y = toRad(point.latitude - origin.latitude) * EARTH_RADIUS_METERS;
  return { x, y };
}

function isPointInsidePolygon(
  point: Coordinate,
  polygon: Coordinate[],
): boolean {
  if (polygon.length < 3) return false;

  const localPolygon = polygon.map((vertex) => toLocalMeters(point, vertex));
  let inside = false;

  for (
    let i = 0, j = localPolygon.length - 1;
    i < localPolygon.length;
    j = i++
  ) {
    const xi = localPolygon[i].x;
    const yi = localPolygon[i].y;
    const xj = localPolygon[j].x;
    const yj = localPolygon[j].y;

    const intersects =
      yi > 0 !== yj > 0 &&
      0 < ((xj - xi) * -yi) / (yj - yi === 0 ? Number.EPSILON : yj - yi) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function distanceToSegmentMeters(
  point: XYPoint,
  segmentStart: XYPoint,
  segmentEnd: XYPoint,
): number {
  const dx = segmentEnd.x - segmentStart.x;
  const dy = segmentEnd.y - segmentStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return Math.hypot(point.x - segmentStart.x, point.y - segmentStart.y);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((point.x - segmentStart.x) * dx + (point.y - segmentStart.y) * dy) /
        lengthSquared,
    ),
  );
  const projectionX = segmentStart.x + t * dx;
  const projectionY = segmentStart.y + t * dy;

  return Math.hypot(point.x - projectionX, point.y - projectionY);
}

function distanceToPolygonMeters(
  point: Coordinate,
  polygon: Coordinate[],
): number {
  if (polygon.length === 0) return Infinity;
  if (polygon.length === 1) return haversineDistance(point, polygon[0]);
  if (isPointInsidePolygon(point, polygon)) return 0;

  const localPoint = { x: 0, y: 0 };
  const localPolygon = polygon.map((vertex) => toLocalMeters(point, vertex));
  let minDistance = Infinity;

  for (let i = 0; i < localPolygon.length; i++) {
    const start = localPolygon[i];
    const end = localPolygon[(i + 1) % localPolygon.length];
    const distance = distanceToSegmentMeters(localPoint, start, end);
    if (distance < minDistance) {
      minDistance = distance;
    }
  }

  return minDistance;
}

export function findNearestBuilding(
  userLocation: Coordinate,
  buildings: Building[] = BUILDINGS,
): NearestBuildingResult | null {
  if (!buildings.length) return null;

  let nearest: NearestBuildingResult | null = null;

  for (const building of buildings) {
    const distance =
      building.polygon?.length > 0
        ? distanceToPolygonMeters(userLocation, building.polygon)
        : haversineDistance(userLocation, building.marker);
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
      distanceInterval: 1,
    }),
    idle: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.Low,
      timeInterval: 1000,
      distanceInterval: 1,
    }),
    walking: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 1,
    }),
    biking: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.High,
      timeInterval: 1000,
      distanceInterval: 1,
    }),
    transit: new StaticWatcherStrategy({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 1000,
      distanceInterval: 1,
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
