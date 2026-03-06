import { useCallback, useRef } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useLocationStore, { PermissionStatus } from "./useLocationStore";

const PERMISSION_SCREEN_KEY = "@location_permission_screen_seen";
const PREVIOUS_PERMISSION_KEY = "@location_permission_previous";
const USER_SKIPPED_KEY = "@location_user_skipped";

export default function useLocationPermission() {
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
  const setLastPermissionCheck = useLocationStore(
    (s) => s.setLastPermissionCheck,
  );
  const initRef = useRef(false);

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
        await AsyncStorage.setItem(USER_SKIPPED_KEY, "false");
        setUserSkippedPermission(false);
        setPermissionStatus("granted");
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
    setCanAskAgain,
    setLastPermissionCheck,
    setPermissionStatus,
    setUserSkippedPermission,
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
        setPermissionStatus("denied");
        setUserSkippedPermission(false);
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
    } catch (error) {
      console.error("Error initializing location service:", error);
    } finally {
      setIsInitialized(true);
    }
  }, [
    checkPermission,
    setHasSeenPermissionScreen,
    setIsInitialized,
    setUserSkippedPermission,
  ]);

  return {
    initialize,
    checkLocationServices,
    checkPermission,
    requestPermission,
    markPermissionScreenSeen,
    markUserSkipped,
  };
}
