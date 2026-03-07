import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import { hasIndoorMaps, getDefaultFloor } from "../../utils/buildingIndoorMaps";
import MapView, {
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import SearchBar from "../../components/search-bar/SearchBar";
import SearchPanel from "../../components/SearchPanel";
import FloatingActionButton from "../../components/FloatingActionButton";
import CampusSwitcher from "../../components/CampusSwitcher";
import {
  Accessibility,
  Building,
  BuildingId,
  BUILDINGS,
} from "../../data/buildings";
import BuildingMarker from "../../components/BuildingMarker";
import BuildingPopup from "../../components/BuildingPopup";
import UpcomingEventButton from "../../components/UpcomingEventButton";
import EventDetailsPopup from "../../components/EventDetailsPopup";
import useNavigationState from "../../hooks/useNavigationState";
import { NAVIGATION_STATE } from "../../const";
import NavigationConfigView from "../../components/navigation-config/NavigationConfigView";
import { styles as navStyles } from "../../components/BottomNav";
import useNavigationEndpoints from "../../hooks/useNavigationEndpoints";
import DirectionPath from "../../components/DirectionPath";
import useNavigationConfig from "../../hooks/useNavigationConfig";
import useNavigationInfo from "../../hooks/useNavigationInfo";
import { getAllOutdoorDirectionsInfo, searchLocations } from "../../api";
import { NamedCoordinate, TRANSPORT_MODE_API_MAP } from "../../type";
import { reverseGeocode } from "../../services/handleGeocode";
import { findBuildingFromLocationText } from "../../utils/eventLocationBuildingMatcher";
import { haversineDistance } from "../../utils/locationUtils";
import NavigationInfoBottom from "../../components/navigation-info/NavigationInfoBottom";
import NavigationDirectionHUDBottom from "../../components/navigation-direction/NavigationDirectionHUDBottom";
import NavigationCancelBottom from "../../components/navigation-cancel/NavigationCancelBottom";
import useLocationService from "../../hooks/useLocationService";
import useLocationStore from "../../hooks/useLocationStore";
import useRerouting from "../../hooks/useRerouting";
import useNavigationProgress from "../../hooks/useNavigationProgress";
import LocationPromptModal from "../../components/LocationPromptModal";

const SGW_CENTER = { latitude: 45.4973, longitude: -73.579 };
const LOYOLA_CENTER = { latitude: 45.4582, longitude: -73.6405 };
const CAMPUS_REGION_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };
const NAVIGATION_ZOOM = { latitudeDelta: 0.004, longitudeDelta: 0.004 };

const SHUTTLE_STOPS = {
  SGW: { latitude: 45.497122, longitude: -73.578471 },
  LOYOLA: { latitude: 45.45844144049705, longitude: -73.63831707854963 },
} as const;

const BURGUNDY = "#800020";
const OUTLINE_EXIT_LAT_DELTA = 0.006;
const OUTLINE_ENTER_REGION: Pick<Region, "latitudeDelta" | "longitudeDelta"> = {
  latitudeDelta: 0.0028,
  longitudeDelta: 0.0028,
};
const FREEZE_MARKERS_AFTER_MS = 800;

type EventDetailsPayload = {
  title: string;
  detailsText: string;
  showDirections: boolean;
  accessibility?: Accessibility;
  onDirections: () => void;
  onChangeCalendar: () => void;
  onLogout: () => void;
};

export default function HomePageIndex() {
  const navigation = useNavigation();
  const router = useRouter();
  const params = useLocalSearchParams<{ shuttleCampus?: string }>();

  const [campus, setCampus] = useState<"SGW" | "LOYOLA">("SGW");
  const {
    setNavigationState,
    isNavigating,
    isConfiguring,
    isSearching,
    isIdle,
    isCancellingNavigation,
  } = useNavigationState();
  const { origin, setOrigin, destination, setDestination, swap, clear } =
    useNavigationEndpoints();
  const allOutdoorRoutes = useNavigationConfig((s) => s.allOutdoorRoutes);
  const setAllOutdoorRoutes = useNavigationConfig((s) => s.setAllOutdoorRoutes);
  const navigationMode = useNavigationConfig((s) => s.navigationMode);
  const setIsLoading = useNavigationInfo((s) => s.setIsLoading);
  const setPathDistance = useNavigationInfo((s) => s.setPathDistance);
  const setPathDuration = useNavigationInfo((s) => s.setPathDuration);
  const [toggleNavigationInfoState, setToggleNavigationInfoState] = useState<
    "maximize" | "minimize"
  >("minimize");
  const [toggleNavigationHUDState, setToggleNavigationHUDState] = useState<
    "maximize" | "minimize"
  >("minimize");

  const {
    requestPermission,
    markPermissionScreenSeen,
    markUserSkipped,
    openSettings,
    getCurrentPosition,
    checkPermission,
  } = useLocationService();

  const isInitialized = useLocationStore((state) => state.isInitialized);
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const canAskAgain = useLocationStore((state) => state.canAskAgain);
  const hasSeenPermissionScreen = useLocationStore(
    (state) => state.hasSeenPermissionScreen,
  );
  const userSkippedPermission = useLocationStore(
    (state) => state.userSkippedPermission,
  );
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const nearestBuilding = useLocationStore((state) => state.nearestBuilding);
  const nearestBuildingDistance = useLocationStore(
    (state) => state.nearestBuildingDistance,
  );

  const { isRerouting } = useRerouting();
  const currentStepIndex = useNavigationProgress(
    (state) => state.currentStepIndex,
  );
  const resetNavigationProgress = useNavigationProgress(
    (state) => state.resetProgress,
  );

  const hasLocationPermission = permissionStatus === "granted";
  const shouldShowOSPrompt =
    !userSkippedPermission &&
    (canAskAgain || permissionStatus === "undetermined");

  const shouldShowEnableLocation = (() => {
    if (!isInitialized) return false;
    if (permissionStatus === "granted") return false;
    if (permissionStatus === "revoked") return true;
    if (permissionStatus === "denied" && !userSkippedPermission) return true;
    if (!hasSeenPermissionScreen) return true;
    return false;
  })();

  const [region, setRegion] = useState<Region>({
    latitude: SGW_CENTER.latitude,
    longitude: SGW_CENTER.longitude,
    ...CAMPUS_REGION_DELTA,
  });

  const [shuttleStop, setShuttleStop] = useState<{
    campus: "SGW" | "LOYOLA";
    coordinate: { latitude: number; longitude: number };
  } | null>(null);

  const [selectedBuildingId, setSelectedBuildingId] =
    useState<BuildingId | null>(null);
  const [outlineMode, setOutlineMode] = useState(false);
  const [showBuildingPopup, setShowBuildingPopup] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetailsPayload | null>(
    null,
  );

  const [mapReady, setMapReady] = useState(false);
  const [freezeMarkers, setFreezeMarkers] = useState(false);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  } | null>(null);

  const mapRef = useRef<MapView>(null);

  const navigatingRef = useRef(false);

  // Re-check permission when initialized - handles return from settings
  useEffect(() => {
    if (isInitialized && permissionStatus !== "granted") {
      checkPermission();
    }
  }, [isInitialized]);

  // ── Derive active route steps for the HUD ──────────────────────────────
  const apiMode = TRANSPORT_MODE_API_MAP[navigationMode];
  const activeRoute =
    allOutdoorRoutes?.find(
      (r) => r.transportMode?.toLowerCase() === apiMode?.toLowerCase(),
    ) ??
    allOutdoorRoutes?.[0] ??
    null;

  const allSteps = activeRoute?.steps ?? [];
  const hudSteps = allSteps.slice(currentStepIndex);
  const hudTopStep = hudSteps.length > 1 ? hudSteps[1] : hudSteps[0];
  // ───────────────────────────────────────────────────────────────────────

  // When navigation starts, clear UI clutter + zoom to user ──────
  useEffect(() => {
    if (!isNavigating) return;
    setShowBuildingPopup(false);
    setSelectedBuildingId(null);
    setOutlineMode(false);
    getOneFix()
      .then((fix) => animateToRegion({ ...fix, ...NAVIGATION_ZOOM }))
      .catch(() => {});
  }, [isNavigating]);

  useEffect(() => {
    if (
      params.shuttleCampus &&
      (params.shuttleCampus === "SGW" || params.shuttleCampus === "LOYOLA")
    ) {
      const targetCampus = params.shuttleCampus;
      const coord = SHUTTLE_STOPS[targetCampus];
      setCampus(targetCampus);
      setShuttleStop({ campus: targetCampus, coordinate: coord });
      setSelectedBuildingId(null);
      setOutlineMode(false);
      setShowBuildingPopup(false);
    }
  }, [params.shuttleCampus]);

  useEffect(() => {
    if (!shuttleStop || shouldShowEnableLocation || !mapReady) return;
    requestAnimationFrame(() => {
      animateToRegion({
        latitude: shuttleStop.coordinate.latitude,
        longitude: shuttleStop.coordinate.longitude,
        ...CAMPUS_REGION_DELTA,
      });
    });
    scheduleFreezeMarkers();
  }, [shuttleStop, shouldShowEnableLocation, mapReady]);

  useEffect(() => {
    scheduleFreezeMarkers();
    return () => {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    };
  }, [shouldShowEnableLocation]);

  useEffect(() => {
    const style =
      isConfiguring || isNavigating || isCancellingNavigation
        ? { display: "none" }
        : navStyles.tabBarStyle;

    navigation.setOptions({ tabBarStyle: style });

    navigation.getParent()?.setOptions({ tabBarStyle: style });
  }, [isConfiguring, isNavigating, isCancellingNavigation, navigation]);

  useEffect(() => {
    scheduleFreezeMarkers();
    return () => {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    };
  }, [mapReady, shouldShowEnableLocation, isConfiguring, isNavigating]);

  const onPressIndoorMaps = () => {
    if (selectedBuildingId) {
      setShowBuildingPopup(false);
      const defaultFloor = getDefaultFloor(selectedBuildingId);
      router.push({
        pathname: "/indoor-navigation",
        params: { buildingId: selectedBuildingId, floor: defaultFloor },
      });
    }
  };

  const getOneFix = async (): Promise<Region> => {
    const coords = await getCurrentPosition();
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      ...CAMPUS_REGION_DELTA,
    };
  };

  const getCampusForCoordinate = (coords: {
    latitude: number;
    longitude: number;
  }): "SGW" | "LOYOLA" => {
    const distToSGW = haversineDistance(coords, SGW_CENTER);
    const distToLOYOLA = haversineDistance(coords, LOYOLA_CENTER);
    return distToSGW <= distToLOYOLA ? "SGW" : "LOYOLA";
  };

  const getCampusFallbackOrigin = (targetCampus: "SGW" | "LOYOLA") => {
    const shuttle = SHUTTLE_STOPS[targetCampus];
    return {
      latitude: shuttle.latitude,
      longitude: shuttle.longitude,
      label: `${targetCampus} Shuttle Stop`,
    };
  };

  const getDirectionsOrigin = async (destinationCoords?: {
    latitude: number;
    longitude: number;
  }): Promise<{
    latitude: number;
    longitude: number;
    label: string;
  }> => {
    if (hasLocationPermission) {
      try {
        const fix = await getOneFix();
        const label = await reverseGeocode(fix).catch(() => "Current Location");
        return {
          latitude: fix.latitude,
          longitude: fix.longitude,
          label,
        };
      } catch {
        // Fall back below when a GPS fix is temporarily unavailable.
      }
    }

    if (currentLocation) {
      return {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        label: "Current Location",
      };
    }

    const targetCampus = destinationCoords
      ? getCampusForCoordinate(destinationCoords)
      : campus;
    return getCampusFallbackOrigin(targetCampus);
  };

  const animateToRegion = (r: Region) => {
    mapRef.current?.animateToRegion(r, 650);
  };

  const scheduleFreezeMarkers = () => {
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    setFreezeMarkers(false);
    if (!mapReady || shouldShowEnableLocation) return;
    freezeTimerRef.current = setTimeout(
      () => setFreezeMarkers(true),
      FREEZE_MARKERS_AFTER_MS,
    );
  };

  const onPressFab = async () => {
    try {
      setEventDetails(null);
      if (hasLocationPermission) {
        animateToRegion(await getOneFix());
        return;
      }
      router.push({
        pathname: "/(home-page)/enable-location",
        params: permissionStatus === "revoked" ? { reason: "revoked" } : {},
      });
    } catch {
      Alert.alert("Location error", "Could not center the map.");
    }
  };

  const onEnableLocation = async () => {
    try {
      const granted = await requestPermission();
      await markPermissionScreenSeen();

      if (!granted) {
        Alert.alert(
          "Permission Denied",
          "You can enable location later in device settings.",
          [
            { text: "Continue", style: "cancel" },
            { text: "Open Settings", onPress: () => void openSettings() },
          ],
        );
        return;
      }
      animateToRegion(await getOneFix());
    } catch {
      Alert.alert("Location error", "Could not retrieve your location.");
    }
  };

  const onSkipLocation = async () => {
    await markUserSkipped();
  };

  const onChangeCampus = (next: "SGW" | "LOYOLA") => {
    setEventDetails(null);
    setCampus(next);
    scheduleFreezeMarkers();
    animateToRegion({
      ...(next === "SGW" ? SGW_CENTER : LOYOLA_CENTER),
      ...CAMPUS_REGION_DELTA,
    });
    setSelectedBuildingId(null);
    setOutlineMode(false);
    setShowBuildingPopup(false);
    setShuttleStop(null);
    setNavigationState(NAVIGATION_STATE.IDLE);
  };

  const selectedBuilding: Building | null = selectedBuildingId
    ? (BUILDINGS.find((b) => b.id === selectedBuildingId) ?? null)
    : null;

  const enterOutlineForBuilding = (b: Building) => {
    scheduleFreezeMarkers();
    setShuttleStop(null);
    setSelectedBuildingId(b.id);
    setOutlineMode(true);
    setShowBuildingPopup(false);
    animateToRegion({
      latitude: b.marker.latitude,
      longitude: b.marker.longitude,
      ...OUTLINE_ENTER_REGION,
    });
  };

  const onPressBuilding = (b: Building) => {
    if (isNavigating) return;
    setNavigationState(NAVIGATION_STATE.IDLE);
    if (selectedBuildingId !== b.id || !outlineMode) {
      setDestination({
        longitude: b.marker.longitude,
        latitude: b.marker.latitude,
        label: b.name,
      });
      enterOutlineForBuilding(b);
      return;
    }
    setShowBuildingPopup(true);
  };

  const NEARBY_BUILDING_THRESHOLD_METERS = 50;

  const proceedWithDirections = async (
    originCoords: { latitude: number; longitude: number; label: string },
    destCoords: { latitude: number; longitude: number; label: string },
  ) => {
    setIsLoading(true);
    setNavigationState(NAVIGATION_STATE.ROUTE_CONFIGURING);

    try {
      setOrigin(originCoords);
      setDestination(destCoords);

      const routes = await getAllOutdoorDirectionsInfo(
        originCoords,
        destCoords,
      );
      setAllOutdoorRoutes(routes);

      const walkRoute = routes.find(
        (r) => r.transportMode?.toUpperCase() === "WALKING",
      );
      if (walkRoute) {
        setPathDistance(walkRoute.distance);
        setPathDuration(walkRoute.duration);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      Alert.alert(
        "Navigation error",
        "Could not fetch directions. Please try again.",
      );
      setNavigationState(NAVIGATION_STATE.IDLE);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationPromptInside = async () => {
    setShowLocationPrompt(false);
    if (!pendingDestination || !nearestBuilding) return;

    const originCoords = {
      latitude: nearestBuilding.marker.latitude,
      longitude: nearestBuilding.marker.longitude,
      label: `${nearestBuilding.name} (Inside)`,
    };

    await proceedWithDirections(originCoords, pendingDestination);
    setPendingDestination(null);
  };

  const handleLocationPromptOutside = async () => {
    setShowLocationPrompt(false);
    if (!pendingDestination || !currentLocation) return;

    const label = await reverseGeocode(currentLocation).catch(
      () => "Current Location",
    );

    const originCoords = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      label,
    };

    await proceedWithDirections(originCoords, pendingDestination);
    setPendingDestination(null);
  };

  const handleLocationPromptClose = () => {
    setShowLocationPrompt(false);
    setPendingDestination(null);
  };

  const onPressDirections = async () => {
    setShowBuildingPopup(false);
    if (!selectedBuilding) return;

    const destCoords = {
      latitude: selectedBuilding.marker.latitude,
      longitude: selectedBuilding.marker.longitude,
      label: selectedBuilding.name,
    };

    if (shouldPromptForSelectedBuilding(selectedBuilding.id, destCoords))
      return;

    const originCoords = await getDirectionsOrigin(destCoords);
    await proceedWithDirections(originCoords, destCoords);
  };

  const routeToDestination = async (
    destCoords: {
      latitude: number;
      longitude: number;
    },
    destinationLabel = "Selected Location",
    destinationBuildingId?: string,
  ) => {
    const labeledDestCoords = {
      latitude: destCoords.latitude,
      longitude: destCoords.longitude,
      label: destinationLabel,
    };

    if (
      destinationBuildingId
        ? shouldPromptForSelectedBuilding(
            destinationBuildingId,
            labeledDestCoords,
          )
        : shouldPromptForNearbyBuilding(destCoords, labeledDestCoords)
    ) {
      return;
    }

    const originCoords = await getDirectionsOrigin(destCoords);

    await proceedWithDirections(originCoords, labeledDestCoords);
  };

  function shouldPromptForNearbyBuilding(
    destCoords: { latitude: number; longitude: number },
    labeledDestCoords: {
      latitude: number;
      longitude: number;
      label: string;
    },
  ): boolean {
    if (
      !hasLocationPermission ||
      !nearestBuilding ||
      nearestBuildingDistance === null ||
      nearestBuildingDistance >= NEARBY_BUILDING_THRESHOLD_METERS
    ) {
      return false;
    }

    const destMatchesNearBuilding =
      Math.abs(destCoords.latitude - nearestBuilding.marker.latitude) <
        0.0005 &&
      Math.abs(destCoords.longitude - nearestBuilding.marker.longitude) <
        0.0005;

    if (destMatchesNearBuilding) {
      return false;
    }

    setPendingDestination(labeledDestCoords);
    setShowLocationPrompt(true);
    return true;
  }

  function shouldPromptForSelectedBuilding(
    selectedBuildingId: string,
    destCoords: { latitude: number; longitude: number; label: string },
  ): boolean {
    if (
      !nearestBuilding ||
      nearestBuildingDistance === null ||
      nearestBuildingDistance >= NEARBY_BUILDING_THRESHOLD_METERS ||
      nearestBuilding.id === selectedBuildingId
    ) {
      return false;
    }

    setPendingDestination(destCoords);
    setShowLocationPrompt(true);
    return true;
  }

  const parseLatLng = (
    value: string,
  ): { latitude: number; longitude: number } | null => {
    const match = new RegExp(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    ).exec(value);
    if (!match) return null;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  };

  const onPressEventDirections = async (locationText: string) => {
    try {
      const maybeCoords = parseLatLng(locationText);
      if (maybeCoords) {
        await routeToDestination(maybeCoords);
        return;
      }

      const localBuildingMatch = findBuildingFromLocationText(locationText);
      if (localBuildingMatch) {
        await routeToDestination(
          localBuildingMatch.marker,
          localBuildingMatch.name,
          localBuildingMatch.id,
        );
        return;
      }

      const results = await searchLocations(locationText);
      const firstWithCoords = results.find(
        (place) =>
          place?.location?.latitude != null &&
          place?.location?.longitude != null,
      );

      if (!firstWithCoords?.location) {
        Alert.alert(
          "Directions error",
          "Could not find route coordinates for this event location.",
        );
        return;
      }

      await routeToDestination(
        {
          latitude: firstWithCoords.location.latitude,
          longitude: firstWithCoords.location.longitude,
        },
        firstWithCoords.name ?? "Selected Location",
      );
    } catch {
      Alert.alert(
        "Directions error",
        "Could not start directions for this event.",
      );
    }
  };

  const handleRegionChangeComplete = (r: Region) => {
    setRegion(r);
    if (outlineMode && r.latitudeDelta > OUTLINE_EXIT_LAT_DELTA) {
      setOutlineMode(false);
      setShowBuildingPopup(false);
      setSelectedBuildingId(null);
    }
  };

  const handleSelectLocation = async ({
    latitude,
    longitude,
    name,
  }: NamedCoordinate) => {
    const destCoords = {
      latitude,
      longitude,
      label: name ?? "Selected Location",
    };

    if (shouldPromptForNearbyBuilding({ latitude, longitude }, destCoords)) {
      return;
    }

    try {
      const originCoords = await getDirectionsOrigin({ latitude, longitude });

      await proceedWithDirections(originCoords, destCoords);

      mapRef.current?.fitToCoordinates(
        [originCoords, { latitude, longitude }],
        {
          edgePadding: { top: 100, right: 50, bottom: 150, left: 50 },
          animated: true,
        },
      );
    } catch (error) {
      Alert.alert(
        "Navigation error",
        "Unable to fetch directions to this location.",
      );
    }
  };

  const handleSwap = async () => {
    if (!origin || !destination) return;

    setIsLoading(true);

    const newOrigin = destination;
    const newDest = origin;
    swap();

    try {
      const routes = await getAllOutdoorDirectionsInfo(newOrigin, newDest);
      setAllOutdoorRoutes(routes);

      const walkRoute = routes.find(
        (r) => r.transportMode?.toUpperCase() === "WALKING",
      );
      if (walkRoute) {
        setPathDistance(walkRoute.distance);
        setPathDuration(walkRoute.duration);
      }
    } catch (error) {
      console.error("Error fetching swapped directions:", error);
      Alert.alert("Navigation error", "Could not fetch directions after swap.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoNavConfig = () => {
    navigatingRef.current = true;
    setNavigationState(NAVIGATION_STATE.NAVIGATING);
    setToggleNavigationInfoState("minimize");
    setToggleNavigationHUDState("minimize");
  };

  const handleCloseNavConfig = () => {
    if (navigatingRef.current) return;
    setNavigationState(NAVIGATION_STATE.IDLE);
  };

  const onToggleNavigationInfoState = () => {
    setToggleNavigationInfoState(
      toggleNavigationInfoState === "maximize" ? "minimize" : "maximize",
    );
  };

  const handleResumeNavigation = () => {
    setNavigationState(NAVIGATION_STATE.NAVIGATING);
  };

  const handleCancelTrip = () => {
    navigatingRef.current = false;
    setIsLoading(false);
    setNavigationState(NAVIGATION_STATE.IDLE);
    setToggleNavigationInfoState("minimize");
    setToggleNavigationHUDState("minimize");
    setPathDistance("0");
    setPathDuration("0");
    setAllOutdoorRoutes([]);
    resetNavigationProgress();
    clear();
  };

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  const handleHUDSnapIndexChange = useCallback((index: number) => {
    if (index < 0) return;
    setToggleNavigationHUDState(index === 1 ? "minimize" : "maximize");
  }, []);

  const handleInfoSnapIndexChange = useCallback((index: number) => {
    if (index < 0) return;
    setToggleNavigationInfoState(index === 1 ? "minimize" : "maximize");
  }, []);

  const isRevoked = permissionStatus === "revoked";

  if (!isInitialized) {
    return (
      <View style={[styles.root, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (shouldShowEnableLocation) {
    return (
      <View style={styles.root}>
        <View style={styles.enableLocationContainer}>
          <View style={styles.enableLocationIconCircle}>
            <Text style={styles.enableLocationIcon}>
              {isRevoked ? "⚠️" : "📍"}
            </Text>
          </View>
          <Text style={styles.enableLocationTitle}>
            {isRevoked
              ? "Location Permission Revoked"
              : "Enable Location Services"}
          </Text>
          <Text style={styles.enableLocationSubtitle}>
            {isRevoked
              ? "Location access was previously granted but has been revoked. Please re-enable in settings."
              : "To help you navigate Concordia's campus, we need access to your location."}
          </Text>
          <View style={styles.enableLocationBullets}>
            <Text style={styles.enableLocationBullet}>
              • Real-time positioning on the map
            </Text>
            <Text style={styles.enableLocationBullet}>
              • Turn-by-turn directions
            </Text>
            <Text style={styles.enableLocationBullet}>
              • Nearby points of interest
            </Text>
          </View>
          {shouldShowOSPrompt ? (
            <Pressable
              style={styles.enableLocationBtn}
              onPress={() => void onEnableLocation()}
            >
              <Text style={styles.enableLocationBtnText}>Enable Location</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.enableLocationBtn}
              onPress={() => void openSettings()}
            >
              <Text style={styles.enableLocationBtnText}>Open Settings</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.enableLocationSkip}
            onPress={() => void onSkipLocation()}
          >
            <Text style={styles.enableLocationSkipText}>
              {isRevoked ? "Continue without location" : "Skip for now"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        showsUserLocation={hasLocationPermission === true}
        showsMyLocationButton={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPress={() => {
          setShowBuildingPopup(false);
          if (!isNavigating && !isCancellingNavigation) {
            setNavigationState(NAVIGATION_STATE.IDLE);
          }
        }}
        onMapReady={() => {
          setMapReady(true);
          scheduleFreezeMarkers();
        }}
      >
        {shuttleStop && (
          <Marker
            coordinate={shuttleStop.coordinate}
            title={`${shuttleStop.campus} Shuttle Stop`}
            pinColor={BURGUNDY}
          />
        )}

        {BUILDINGS.map((b) => (
          <Marker
            key={b.id}
            coordinate={b.marker}
            onPress={(e) => {
              e.stopPropagation?.();
              onPressBuilding(b);
            }}
            tracksViewChanges={!freezeMarkers}
          >
            <BuildingMarker label={b.id} />
          </Marker>
        ))}

        {outlineMode && selectedBuilding && (
          <Polygon
            coordinates={selectedBuilding.polygon}
            strokeColor={BURGUNDY}
            strokeWidth={3}
            fillColor="rgba(128,0,32,0.12)"
          />
        )}

        {!isSearching && !isIdle && <DirectionPath destination={destination} />}
      </MapView>

      {showBuildingPopup && selectedBuilding && !isNavigating && (
        <BuildingPopup
          id={selectedBuilding.id}
          name={selectedBuilding.name}
          addressLines={selectedBuilding.addressLines}
          buildingId={selectedBuilding.id}
          openingHours={selectedBuilding.openingHours.label}
          hasStudySpots={selectedBuilding.hasStudySpots}
          image={selectedBuilding.image}
          accessibility={selectedBuilding.accessibility}
          onClose={() => setShowBuildingPopup(false)}
          onDirections={() => onPressDirections()}
          onIndoorMaps={
            hasIndoorMaps(selectedBuilding.id)
              ? () => onPressIndoorMaps()
              : undefined
          }
        />
      )}

      <View
        style={[
          styles.upcomingEventWrapper,
          (shouldShowEnableLocation ||
            isConfiguring ||
            isNavigating ||
            isCancellingNavigation) &&
            styles.overlayHidden,
        ]}
        pointerEvents={
          !shouldShowEnableLocation &&
          !(isConfiguring || isNavigating || isCancellingNavigation)
            ? "auto"
            : "none"
        }
      >
        <UpcomingEventButton
          onMainButtonPress={() => setShowBuildingPopup(false)}
          onRequestDirections={(locationText) => {
            void onPressEventDirections(locationText);
          }}
          onOpenEventDetails={({
            title,
            detailsText,
            showDirections,
            accessibility,
            onDirections,
            onChangeCalendar,
            onLogout,
          }) => {
            setShowBuildingPopup(false);
            setEventDetails({
              title,
              detailsText,
              showDirections,
              accessibility,
              onDirections,
              onChangeCalendar,
              onLogout,
            });
          }}
        />
      </View>

      <EventDetailsPopup
        visible={eventDetails != null}
        title={eventDetails?.title ?? ""}
        detailsText={eventDetails?.detailsText ?? ""}
        showDirections={eventDetails?.showDirections ?? false}
        accessibility={eventDetails?.accessibility}
        onClose={() => setEventDetails(null)}
        onDirections={() => {
          const onDirections = eventDetails?.onDirections;
          setEventDetails(null);
          onDirections?.();
        }}
        onChangeCalendar={() => {
          const onChangeCalendar = eventDetails?.onChangeCalendar;
          setEventDetails(null);
          onChangeCalendar?.();
        }}
        onLogout={() => {
          const onLogout = eventDetails?.onLogout;
          setEventDetails(null);
          onLogout?.();
        }}
      />

      {nearestBuilding && (
        <LocationPromptModal
          visible={showLocationPrompt}
          building={nearestBuilding}
          onSelectInside={handleLocationPromptInside}
          onSelectOutside={handleLocationPromptOutside}
          onClose={handleLocationPromptClose}
        />
      )}

      <View style={styles.searchWrapper}>
        <SearchBar
          placeholder="Search"
          onPress={() => setNavigationState(NAVIGATION_STATE.SEARCHING)}
          isConfiguring={isConfiguring}
          isNavigating={isNavigating}
          isCancellingNavigation={isCancellingNavigation}
          originLabel={origin?.label ?? "Current Location"}
          destinationLabel={destination?.label ?? "Select destination"}
          onBack={() => {
            if (isCancellingNavigation) {
              handleResumeNavigation();
            } else if (isNavigating) {
              setToggleNavigationInfoState("minimize");
              setNavigationState(NAVIGATION_STATE.NAVIGATION_CANCELLING);
            } else {
              setIsLoading(false);
              setNavigationState(NAVIGATION_STATE.IDLE);
              setSelectedBuildingId(null);
              setOutlineMode(false);
              setShowBuildingPopup(false);
              clear();
            }
          }}
          navigationInfoToggleState={toggleNavigationInfoState}
          navigationHUDToggleState={toggleNavigationHUDState}
          navigationHUDStep={hudTopStep}
          onSwap={handleSwap}
        />
      </View>

      <SearchPanel
        visible={isSearching}
        onClose={() => setNavigationState(NAVIGATION_STATE.IDLE)}
        onSelectLocation={handleSelectLocation}
      />
      <NavigationConfigView
        durations={allOutdoorRoutes}
        visible={isConfiguring}
        onClose={() => handleCloseNavConfig()}
        onGo={() => handleGoNavConfig()}
      />
      {!isCancellingNavigation && (
        <FloatingActionButton onPress={() => void onPressFab()} />
      )}

      <View
        style={[
          styles.campusWrapper,
          (isNavigating || isCancellingNavigation) && styles.overlayHidden,
        ]}
        pointerEvents={isNavigating || isCancellingNavigation ? "none" : "auto"}
      >
        <CampusSwitcher value={campus} onChange={onChangeCampus} />
      </View>
      {isNavigating && (
        <>
          {isRerouting && (
            <View style={styles.reroutingBanner}>
              <Text style={styles.reroutingText}>Recalculating route...</Text>
            </View>
          )}
          <NavigationDirectionHUDBottom
            visible={isNavigating}
            steps={hudSteps}
            onSnapIndexChange={handleHUDSnapIndexChange}
          />
          <NavigationInfoBottom
            visible={isNavigating}
            onClose={() => {
              navigatingRef.current = false;
            }}
            onPressAction={onToggleNavigationInfoState}
            onSnapIndexChange={handleInfoSnapIndexChange}
          />
        </>
      )}

      {isCancellingNavigation && (
        <NavigationCancelBottom
          onOpenSettings={handleOpenSettings}
          onConfirmCancel={handleCancelTrip}
          onResumeNavigation={handleResumeNavigation}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  enableLocationContainer: { flex: 1, paddingTop: 80, paddingHorizontal: 24 },
  enableLocationIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(128,0,32,0.18)",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  enableLocationIcon: { fontSize: 40 },
  enableLocationTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  enableLocationSubtitle: {
    textAlign: "center",
    color: "#666",
    lineHeight: 20,
    marginBottom: 24,
  },
  enableLocationBullets: { gap: 12, marginBottom: 28 },
  enableLocationBullet: { color: "#333", fontWeight: "600" },
  enableLocationBtn: {
    backgroundColor: BURGUNDY,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  enableLocationBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  enableLocationSkip: { paddingVertical: 14, alignItems: "center" },
  enableLocationSkipText: { color: "#777", fontWeight: "600" },
  searchWrapper: { position: "absolute", top: 50, left: 16, right: 16 },
  upcomingEventWrapper: {
    position: "absolute",
    bottom: 144,
    width: 300,
    alignSelf: "center",
  },
  overlayHidden: { opacity: 0 },
  campusWrapper: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 90,
    alignItems: "center",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#667",
  },
  reroutingBanner: {
    position: "absolute",
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: BURGUNDY,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 100,
  },
  reroutingText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
