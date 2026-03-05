import { useEffect, useRef, useCallback } from "react";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";
import * as Location from "expo-location";
import { MovementMode } from "./useLocationStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useLocationStore, { PermissionStatus } from "./useLocationStore";
import useNavigationState from "./useNavigationState";
import {
  findNearestBuilding,
  determineMovementMode,
  getWatcherConfigForMode,
  isOnCampus,
} from "../utils/locationUtils";
import { BUILDINGS } from "../data/buildings";

const PERMISSION_SCREEN_KEY = "@location_permission_screen_seen";
const PREVIOUS_PERMISSION_KEY = "@location_permission_previous";
const USER_SKIPPED_KEY = "@location_user_skipped";

export default function useLocationService() {
  // Use individual selectors for state values to avoid unnecessary re-renders
  const isInitialized = useLocationStore((s) => s.isInitialized);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const hasSeenPermissionScreen = useLocationStore(
    (s) => s.hasSeenPermissionScreen,
  );
  const userSkippedPermission = useLocationStore(
    (s) => s.userSkippedPermission,
  );
  const movementMode = useLocationStore((s) => s.movementMode);
  const isWatchingLocation = useLocationStore((s) => s.isWatchingLocation);

  // Stable setter references — only keep ones used outside processLocationUpdate
  const setIsInitialized = useLocationStore((s) => s.setIsInitialized);
  const setPermissionStatus = useLocationStore((s) => s.setPermissionStatus);
  const setLocationServicesEnabled = useLocationStore(
    (s) => s.setLocationServicesEnabled,
  );
  const setCanAskAgain = useLocationStore((s) => s.setCanAskAgain);
  const setHasSeenPermissionScreen = useLocationStore(
    (s) => s.setHasSeenPermissionScreen,
  );
  const setUserSkippedPermission = useLocationStore(
    (s) => s.setUserSkippedPermission,
  );
  const setIsWatchingLocation = useLocationStore(
    (s) => s.setIsWatchingLocation,
  );
  const setIsAppInBackground = useLocationStore((s) => s.setIsAppInBackground);
  const setLastPermissionCheck = useLocationStore(
    (s) => s.setLastPermissionCheck,
  );

  const { isNavigating } = useNavigationState();

  const locationSubRef = useRef<Location.LocationSubscription | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastConfigRef = useRef<string>("");
  const initRef = useRef(false);
  const modeChangeCountRef = useRef<Map<MovementMode, number>>(new Map());
  const stableModeRef = useRef<MovementMode>("idle");

  const MODE_STABILITY_THRESHOLD = 3;

  const checkLocationServices = useCallback(async (): Promise<boolean> => {
    const enabled = await Location.hasServicesEnabledAsync();
    setLocationServicesEnabled(enabled);
    return enabled;
  }, [setLocationServicesEnabled]);

  const checkPermission = useCallback(async (): Promise<PermissionStatus> => {
    try {
      await checkLocationServices();
      const { status, canAskAgain } =
        await Location.getForegroundPermissionsAsync();
      setLastPermissionCheck(Date.now());
      setCanAskAgain(canAskAgain);

      if (status === "granted") {
        await AsyncStorage.setItem(PREVIOUS_PERMISSION_KEY, "granted");
        setPermissionStatus("granted");
        setUserSkippedPermission(false);
        await AsyncStorage.setItem(USER_SKIPPED_KEY, "false");
        return "granted";
      }

      if (status === "denied") {
        const previousStatus = await AsyncStorage.getItem(
          PREVIOUS_PERMISSION_KEY,
        );
        if (previousStatus === "granted") {
          await AsyncStorage.setItem(PREVIOUS_PERMISSION_KEY, "denied");
          await AsyncStorage.setItem(USER_SKIPPED_KEY, "false");
          setUserSkippedPermission(false);
          setPermissionStatus("revoked");
          return "revoked";
        }
        setPermissionStatus("denied");
        return "denied";
      }

      setPermissionStatus("undetermined");
      return "undetermined";
    } catch (error) {
      console.error("Error checking location permission:", error);
      setPermissionStatus("undetermined");
      return "undetermined";
    }
  }, [
    checkLocationServices,
    setPermissionStatus,
    setLastPermissionCheck,
    setUserSkippedPermission,
    setCanAskAgain,
  ]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";

      if (granted) {
        await AsyncStorage.setItem(PREVIOUS_PERMISSION_KEY, "granted");
        await AsyncStorage.setItem(USER_SKIPPED_KEY, "false");
        setPermissionStatus("granted");
        setUserSkippedPermission(false);
      } else {
        await AsyncStorage.setItem(USER_SKIPPED_KEY, "false");
        setUserSkippedPermission(false);
        setPermissionStatus("denied");
      }

      return granted;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  }, [setPermissionStatus, setUserSkippedPermission]);

  const markPermissionScreenSeen = useCallback(async () => {
    await AsyncStorage.setItem(PERMISSION_SCREEN_KEY, "true");
    setHasSeenPermissionScreen(true);
  }, [setHasSeenPermissionScreen]);

  const markUserSkipped = useCallback(async () => {
    await AsyncStorage.setItem(USER_SKIPPED_KEY, "true");
    await AsyncStorage.setItem(PERMISSION_SCREEN_KEY, "true");
    setUserSkippedPermission(true);
    setHasSeenPermissionScreen(true);
  }, [setUserSkippedPermission, setHasSeenPermissionScreen]);

  const initialize = useCallback(async () => {
    if (initRef.current) return;
    initRef.current = true;

    try {
      const [seenValue, skippedValue] = await Promise.all([
        AsyncStorage.getItem(PERMISSION_SCREEN_KEY),
        AsyncStorage.getItem(USER_SKIPPED_KEY),
      ]);

      setHasSeenPermissionScreen(seenValue === "true");
      setUserSkippedPermission(skippedValue === "true");

      await checkPermission();

      setIsInitialized(true);
    } catch (error) {
      console.error("Error initializing location service:", error);
      setIsInitialized(true);
    }
  }, [
    checkPermission,
    setHasSeenPermissionScreen,
    setUserSkippedPermission,
    setIsInitialized,
  ]);

  const openSettings = useCallback(async () => {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
    } else {
      await Linking.openSettings();
    }
  }, []);

  const processLocationUpdate = useRef((location: Location.LocationObject) => {
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
    if (detectedMode === stableModeRef.current) {
      modeChangeCountRef.current.clear();
    } else {
      const count = (modeChangeCountRef.current.get(detectedMode) ?? 0) + 1;
      modeChangeCountRef.current.set(detectedMode, count);
      if (count >= MODE_STABILITY_THRESHOLD) {
        stableModeRef.current = detectedMode;
        modeChangeCountRef.current.clear();
        updates.movementMode = detectedMode;
      }
    }

    if (locChanged) {
      const coords = { latitude, longitude };
      const campusInfo = isOnCampus(coords);
      if (campusInfo.onCampus) {
        const nearest = findNearestBuilding(coords, BUILDINGS);
        if (nearest && nearest.distance < 200) {
          if (
            prev.nearestBuilding?.id !== nearest.building.id ||
            prev.nearestBuildingDistance === null ||
            Math.abs(prev.nearestBuildingDistance - nearest.distance) > 1
          ) {
            updates.nearestBuilding = nearest.building;
            updates.nearestBuildingDistance = nearest.distance;
          }
        } else if (prev.nearestBuilding !== null) {
          updates.nearestBuilding = null;
          updates.nearestBuildingDistance = null;
        }
      } else if (prev.nearestBuilding !== null) {
        updates.nearestBuilding = null;
        updates.nearestBuildingDistance = null;
      }
    }

    if (Object.keys(updates).length > 0) {
      useLocationStore.setState(updates);
    }
  }).current;

  const stopWatching = useCallback(() => {
    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
      lastConfigRef.current = "";
      if (useLocationStore.getState().isWatchingLocation) {
        setIsWatchingLocation(false);
      }
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
  }, [permissionStatus, movementMode, isNavigating, setIsWatchingLocation]);

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
  }, [permissionStatus]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      const wasInBackground = appStateRef.current.match(/inactive|background/);
      const isGoingToBackground = nextAppState.match(/inactive|background/);
      const isComingToForeground = wasInBackground && nextAppState === "active";

      if (isGoingToBackground) {
        setIsAppInBackground(true);
        if (!isNavigating) {
          stopWatching();
        }
      }

      if (isComingToForeground) {
        setIsAppInBackground(false);
        const status = await checkPermission();

        if (status === "granted") {
          startWatching();
        } else {
          stopWatching();
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [
    checkPermission,
    isNavigating,
    startWatching,
    stopWatching,
    setIsAppInBackground,
  ]);

  useEffect(() => {
    if (permissionStatus === "granted") {
      startWatching();
    } else {
      stopWatching();
    }
  }, [permissionStatus, startWatching, stopWatching]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    isInitialized,
    permissionStatus,
    hasSeenPermissionScreen,
    userSkippedPermission,
    checkLocationServices,
    checkPermission,
    requestPermission,
    markPermissionScreenSeen,
    markUserSkipped,
    openSettings,
    startWatching,
    stopWatching,
    getCurrentPosition,
  };
}
