import { useCallback, useRef } from "react";
import * as Location from "expo-location";
import useLocationStore, {
  MovementMode,
  PermissionStatus,
} from "./useLocationStore";
import {
  determineMovementMode,
  getWatcherConfigForMode,
} from "../utils/locationUtils";
import type { NearbyBuildingUpdatesGetter } from "./useNearbyBuildings";

const MODE_STABILITY_THRESHOLD = 3;
type MutableRef<T> = { current: T };

function getStableMovementMode(
  detectedMode: MovementMode,
  stableModeRef: MutableRef<MovementMode>,
  modeChangeCountRef: MutableRef<Map<MovementMode, number>>,
  threshold: number,
): MovementMode | null {
  if (detectedMode === stableModeRef.current) {
    modeChangeCountRef.current.clear();
    return null;
  }

  const count = (modeChangeCountRef.current.get(detectedMode) ?? 0) + 1;
  modeChangeCountRef.current.set(detectedMode, count);
  if (count < threshold) {
    return null;
  }

  stableModeRef.current = detectedMode;
  modeChangeCountRef.current.clear();
  return detectedMode;
}

interface UseLocationWatcherArgs {
  permissionStatus: PermissionStatus;
  movementMode: MovementMode;
  isNavigating: boolean;
  getNearbyBuildingUpdates: NearbyBuildingUpdatesGetter;
}

export default function useLocationWatcher({
  permissionStatus,
  movementMode,
  isNavigating,
  getNearbyBuildingUpdates,
}: UseLocationWatcherArgs) {
  const setIsWatchingLocation = useLocationStore(
    (s) => s.setIsWatchingLocation,
  );
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const lastConfigRef = useRef("");
  const modeChangeCountRef = useRef<Map<MovementMode, number>>(new Map());
  const stableModeRef = useRef<MovementMode>("idle");

  const processLocationUpdate = useCallback(
    (location: Location.LocationObject) => {
      const { latitude, longitude, speed, heading } = location.coords;
      const speedMps = speed ?? 0;

      const prev = useLocationStore.getState();
      const updates: Record<string, unknown> = {};

      const locChanged =
        !prev.currentLocation ||
        Math.abs(prev.currentLocation.latitude - latitude) > 0.0000005 ||
        Math.abs(prev.currentLocation.longitude - longitude) > 0.0000005;

      if (locChanged) {
        updates.currentLocation = { latitude, longitude };
      }

      if (Math.abs(prev.currentSpeed - speedMps) > 0.3) {
        updates.currentSpeed = speedMps;
      }

      if (heading !== null && heading >= 0 && prev.currentHeading !== heading) {
        updates.currentHeading = heading;
      }

      const detectedMode = determineMovementMode(speedMps);
      const stableMode = getStableMovementMode(
        detectedMode,
        stableModeRef,
        modeChangeCountRef,
        MODE_STABILITY_THRESHOLD,
      );
      if (stableMode) {
        updates.movementMode = stableMode;
      }

      if (locChanged) {
        Object.assign(
          updates,
          getNearbyBuildingUpdates(prev, { latitude, longitude }),
        );
      }

      if (Object.keys(updates).length > 0) {
        useLocationStore.setState(updates);
      }
    },
    [getNearbyBuildingUpdates],
  );

  const stopWatching = useCallback(() => {
    if (!locationSubRef.current) return;

    locationSubRef.current.remove();
    locationSubRef.current = null;
    lastConfigRef.current = "";
    if (useLocationStore.getState().isWatchingLocation) {
      setIsWatchingLocation(false);
    }
  }, [setIsWatchingLocation]);

  const startWatching = useCallback(async () => {
    if (permissionStatus !== "granted") {
      return;
    }

    const config = getWatcherConfigForMode(movementMode, isNavigating);
    const configKey = JSON.stringify(config);

    if (locationSubRef.current && lastConfigRef.current === configKey) {
      return;
    }

    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    try {
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: config.accuracy,
          timeInterval: config.timeInterval,
          distanceInterval: config.distanceInterval,
        },
        processLocationUpdate,
      );
      lastConfigRef.current = configKey;
      if (!useLocationStore.getState().isWatchingLocation) {
        setIsWatchingLocation(true);
      }
    } catch (error) {
      console.error("Error starting location watcher:", error);
    }
  }, [
    isNavigating,
    movementMode,
    permissionStatus,
    processLocationUpdate,
    setIsWatchingLocation,
  ]);

  const getCurrentPosition = useCallback(async () => {
    if (permissionStatus !== "granted") {
      throw new Error("Location permission not granted");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    processLocationUpdate(location);

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  }, [permissionStatus, processLocationUpdate]);

  return { startWatching, stopWatching, getCurrentPosition };
}
