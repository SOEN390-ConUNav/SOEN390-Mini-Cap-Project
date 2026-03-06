import { create } from "zustand";
import { Building } from "../data/buildings";
import { Coordinate } from "../type";

export type PermissionStatus =
  | "undetermined"
  | "granted"
  | "denied"
  | "revoked";

export type MovementMode = "idle" | "walking" | "biking" | "transit";

export interface LocationState {
  isInitialized: boolean;
  setIsInitialized: (initialized: boolean) => void;

  permissionStatus: PermissionStatus;
  setPermissionStatus: (status: PermissionStatus) => void;

  locationServicesEnabled: boolean;
  setLocationServicesEnabled: (enabled: boolean) => void;

  canAskAgain: boolean;
  setCanAskAgain: (canAsk: boolean) => void;

  hasSeenPermissionScreen: boolean;
  setHasSeenPermissionScreen: (seen: boolean) => void;

  userSkippedPermission: boolean;
  setUserSkippedPermission: (skipped: boolean) => void;

  currentLocation: Coordinate | null;
  setCurrentLocation: (location: Coordinate | null) => void;

  currentSpeed: number;
  setCurrentSpeed: (speed: number) => void;

  currentHeading: number | null;
  setCurrentHeading: (heading: number | null) => void;

  movementMode: MovementMode;
  setMovementMode: (mode: MovementMode) => void;

  nearestBuilding: Building | null;
  nearestBuildingDistance: number | null;
  setNearestBuilding: (
    building: Building | null,
    distance: number | null,
  ) => void;

  isWatchingLocation: boolean;
  setIsWatchingLocation: (watching: boolean) => void;

  isAppInBackground: boolean;
  setIsAppInBackground: (inBackground: boolean) => void;

  lastPermissionCheck: number;
  setLastPermissionCheck: (timestamp: number) => void;
}

const setter =
  <T extends object>(set: (partial: Partial<T>) => void) =>
  <K extends keyof T>(key: K) =>
  (value: T[K]) =>
    set({ [key]: value } as unknown as Partial<T>);

const useLocationStore = create<LocationState>((set) => {
  const s = setter<LocationState>(set);

  return {
    isInitialized: false,
    setIsInitialized: s("isInitialized"),

    permissionStatus: "undetermined",
    setPermissionStatus: s("permissionStatus"),

    locationServicesEnabled: true,
    setLocationServicesEnabled: s("locationServicesEnabled"),

    canAskAgain: true,
    setCanAskAgain: s("canAskAgain"),

    hasSeenPermissionScreen: false,
    setHasSeenPermissionScreen: s("hasSeenPermissionScreen"),

    userSkippedPermission: false,
    setUserSkippedPermission: s("userSkippedPermission"),

    currentLocation: null,
    setCurrentLocation: s("currentLocation"),

    currentSpeed: 0,
    setCurrentSpeed: s("currentSpeed"),

    currentHeading: null,
    setCurrentHeading: s("currentHeading"),

    movementMode: "idle",
    setMovementMode: s("movementMode"),

    nearestBuilding: null,
    nearestBuildingDistance: null,
    setNearestBuilding: (building, distance) =>
      set({ nearestBuilding: building, nearestBuildingDistance: distance }),

    isWatchingLocation: false,
    setIsWatchingLocation: s("isWatchingLocation"),

    isAppInBackground: false,
    setIsAppInBackground: s("isAppInBackground"),

    lastPermissionCheck: 0,
    setLastPermissionCheck: s("lastPermissionCheck"),
  };
});

export default useLocationStore;
