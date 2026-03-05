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

const useLocationStore = create<LocationState>((set) => ({
  isInitialized: false,
  setIsInitialized: (initialized) => set({ isInitialized: initialized }),

  permissionStatus: "undetermined",
  setPermissionStatus: (status) => set({ permissionStatus: status }),

  locationServicesEnabled: true,
  setLocationServicesEnabled: (enabled) =>
    set({ locationServicesEnabled: enabled }),

  canAskAgain: true,
  setCanAskAgain: (canAsk) => set({ canAskAgain: canAsk }),

  hasSeenPermissionScreen: false,
  setHasSeenPermissionScreen: (seen) => set({ hasSeenPermissionScreen: seen }),

  userSkippedPermission: false,
  setUserSkippedPermission: (skipped) =>
    set({ userSkippedPermission: skipped }),

  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),

  currentSpeed: 0,
  setCurrentSpeed: (speed) => set({ currentSpeed: speed }),

  currentHeading: null,
  setCurrentHeading: (heading) => set({ currentHeading: heading }),

  movementMode: "idle",
  setMovementMode: (mode) => set({ movementMode: mode }),

  nearestBuilding: null,
  nearestBuildingDistance: null,
  setNearestBuilding: (building, distance) =>
    set({ nearestBuilding: building, nearestBuildingDistance: distance }),

  isWatchingLocation: false,
  setIsWatchingLocation: (watching) => set({ isWatchingLocation: watching }),

  isAppInBackground: false,
  setIsAppInBackground: (inBackground) =>
    set({ isAppInBackground: inBackground }),

  lastPermissionCheck: 0,
  setLastPermissionCheck: (timestamp) =>
    set({ lastPermissionCheck: timestamp }),
}));

export default useLocationStore;
