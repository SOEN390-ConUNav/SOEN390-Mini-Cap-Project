import { useCallback, useEffect, useRef } from "react";
import { AppState, AppStateStatus, Linking, Platform } from "react-native";
import useLocationStore from "./useLocationStore";
import useNavigationState from "./useNavigationState";
import useLocationPermission from "./useLocationPermission";
import useLocationWatcher from "./useLocationWatcher";
import useNearbyBuildings from "./useNearbyBuildings";

export default function useLocationService() {
  const isInitialized = useLocationStore((s) => s.isInitialized);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);
  const hasSeenPermissionScreen = useLocationStore(
    (s) => s.hasSeenPermissionScreen,
  );
  const userSkippedPermission = useLocationStore(
    (s) => s.userSkippedPermission,
  );
  const movementMode = useLocationStore((s) => s.movementMode);
  const setIsAppInBackground = useLocationStore((s) => s.setIsAppInBackground);
  const { isNavigating } = useNavigationState();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const {
    initialize,
    checkLocationServices,
    checkPermission,
    requestPermission,
    markPermissionScreenSeen,
    markUserSkipped,
  } = useLocationPermission();

  const { getNearbyBuildingUpdates } = useNearbyBuildings();
  const { startWatching, stopWatching, getCurrentPosition } =
    useLocationWatcher({
      permissionStatus,
      movementMode,
      isNavigating,
      getNearbyBuildingUpdates,
    });

  const openSettings = useCallback(async () => {
    if (Platform.OS === "ios") {
      await Linking.openURL("app-settings:");
      return;
    }
    await Linking.openSettings();
  }, []);

  useEffect(() => {
    void initialize();
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
          void startWatching();
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
    setIsAppInBackground,
    startWatching,
    stopWatching,
  ]);

  useEffect(() => {
    if (permissionStatus === "granted") {
      void startWatching();
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
