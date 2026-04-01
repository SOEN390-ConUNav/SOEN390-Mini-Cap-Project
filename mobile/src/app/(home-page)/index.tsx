import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import { hasIndoorMaps, getDefaultFloor } from "../../utils/buildingIndoorMaps";
import polyline from "@mapbox/polyline";
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
import { BUILDING_EXIT_ROOMS } from "../../data/buildingExits";
import BuildingMarker from "../../components/BuildingMarker";
import BuildingPopup from "../../components/BuildingPopup";
import UpcomingEventButton from "../../components/UpcomingEventButton";
import EventDetailsPopup from "../../components/EventDetailsPopup";
import useNavigationState from "../../hooks/useNavigationState";
import { NAVIGATION_STATE } from "../../const";
import NavigationConfigView from "../../components/navigation-config/NavigationConfigView";
import { useTabBarStyle } from "../../components/BottomNav";
import useNavigationEndpoints from "../../hooks/useNavigationEndpoints";
import DirectionPath from "../../components/DirectionPath";
import useNavigationConfig from "../../hooks/useNavigationConfig";
import useNavigationInfo from "../../hooks/useNavigationInfo";
import { getAllOutdoorDirectionsInfo, searchLocations } from "../../api";
import {
  NamedCoordinate,
  TRANSPORT_MODE_API_MAP,
  ManeuverTypeApi,
} from "../../type";
import { reverseGeocode } from "../../services/handleGeocode";
import { findBuildingFromLocationText } from "../../utils/eventLocationBuildingMatcher";
import { haversineDistance } from "../../utils/locationUtils";
import {
  buildEventIndoorTarget,
  EventDirectionsRequest,
  EventIndoorTarget,
} from "../../utils/eventIndoorNavigation";
import NavigationInfoBottom from "../../components/navigation-info/NavigationInfoBottom";
import NavigationDirectionHUDBottom from "../../components/navigation-direction/NavigationDirectionHUDBottom";
import NavigationCancelBottom from "../../components/navigation-cancel/NavigationCancelBottom";
import useLocationService from "../../hooks/useLocationService";
import useLocationStore from "../../hooks/useLocationStore";
import useRerouting from "../../hooks/useRerouting";
import useNavigationProgress from "../../hooks/useNavigationProgress";
import { useIndoorHandoffStore } from "../../hooks/useIndoorHandoffStore";
import LocationPromptModal from "../../components/LocationPromptModal";
import { useGeneralSettingsStore } from "../../hooks/useGeneralSettings";
import { useTheme } from "../../hooks/useTheme";
import { DARK_MAP_STYLE } from "../../constants/mapStyles";

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
const EVENT_INDOOR_HANDOFF_DISTANCE_METERS = 10;

type IndoorExitTarget = {
  buildingId: BuildingId;
  floor: string;
  exitRoom: string;
};

type OutdoorResumeEndpoint = {
  latitude: number;
  longitude: number;
  label: string;
  buildingId?: BuildingId;
};

const getIndoorExitTarget = (
  buildingId: BuildingId,
): IndoorExitTarget | null => {
  const exitTarget = BUILDING_EXIT_ROOMS[buildingId];
  if (!exitTarget) {
    return null;
  }

  return {
    buildingId,
    floor: exitTarget.floor,
    exitRoom: exitTarget.room,
  };
};

const normalizeCurrentLocationLabel = (label: string | null | undefined) => {
  const trimmed = label?.trim();
  if (!trimmed) {
    return "Current Location";
  }

  // Reverse geocoding can return only the civic number (e.g. "1455"),
  // which reads poorly in the route card.
  if (/^\d+[A-Za-z]?$/.test(trimmed)) {
    return "Current Location";
  }

  return trimmed;
};

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
  const tabBarStyle = useTabBarStyle();
  const { defaultCampus, hydrateFromStorage: hydrateGeneral } =
    useGeneralSettingsStore();
  const { colors, isDark } = useTheme();

  const [campus, setCampus] = useState<"SGW" | "LOYOLA">("SGW");

  useEffect(() => {
    let mounted = true;
    hydrateGeneral().then(() => {
      if (mounted) setCampus(useGeneralSettingsStore.getState().defaultCampus);
    });
    return () => {
      mounted = false;
    };
  }, [hydrateGeneral]);

  useEffect(() => {
    // Keep Home tab aligned with the selected default campus unless shuttle flow explicitly overrides it.
    if (!params.shuttleCampus) {
      setCampus(defaultCampus);
    }
  }, [defaultCampus, params.shuttleCampus]);

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
  const pathDistance = useNavigationInfo((s) => s.pathDistance);
  const setIsLoading = useNavigationInfo((s) => s.setIsLoading);
  const setPathDistance = useNavigationInfo((s) => s.setPathDistance);
  const setPathDuration = useNavigationInfo((s) => s.setPathDuration);
  const [toggleNavigationInfoState, setToggleNavigationInfoState] = useState<
    "maximize" | "minimize"
  >("minimize");
  const [toggleNavigationHUDState, setToggleNavigationHUDState] = useState<
    "maximize" | "minimize"
  >("minimize");
  const [navigationUiDismissed, setNavigationUiDismissed] = useState(false);

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
  const currentHeading = useLocationStore((state) => state.currentHeading);
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
    buildingId?: BuildingId;
    eventIndoorTarget?: EventIndoorTarget | null;
  } | null>(null);
  const [activeEventIndoorTarget, setActiveEventIndoorTarget] =
    useState<EventIndoorTarget | null>(null);
  const [pendingIndoorExitTarget, setPendingIndoorExitTarget] =
    useState<IndoorExitTarget | null>(null);
  const [showIndoorFallbackNotice, setShowIndoorFallbackNotice] =
    useState(false);
  const pendingIndoorHandoffTarget = useIndoorHandoffStore(
    (s) => s.pendingIndoorTarget,
  );
  const clearPendingIndoorHandoffTarget = useIndoorHandoffStore(
    (s) => s.clearPendingIndoorTarget,
  );
  const indoorHandoffInFlightRef = useRef(false);

  const mapRef = useRef<MapView>(null);

  const navigatingRef = useRef(false);

  useEffect(() => {
    if (!pendingIndoorHandoffTarget) {
      return;
    }

    setActiveEventIndoorTarget(pendingIndoorHandoffTarget);
    clearPendingIndoorHandoffTarget();
  }, [clearPendingIndoorHandoffTarget, pendingIndoorHandoffTarget]);

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
  const hudSteps = useMemo(() => {
    if (allSteps.length > 0) {
      const boundedStepIndex = Math.min(
        currentStepIndex,
        Math.max(0, allSteps.length - 1),
      );
      return allSteps.slice(boundedStepIndex);
    }

    if (!activeRoute?.polyline) {
      return [];
    }

    return [
      {
        instruction: `Continue to ${destination?.label ?? "destination"}`,
        distance: pathDistance || activeRoute.distance,
        duration: activeRoute.duration,
        maneuverType: "STRAIGHT" as ManeuverTypeApi,
        polyline: activeRoute.polyline,
      },
    ];
  }, [
    activeRoute?.distance,
    activeRoute?.duration,
    activeRoute?.polyline,
    allSteps,
    currentStepIndex,
    destination?.label,
    pathDistance,
  ]);
  const hudTopStep = hudSteps.length > 1 ? hudSteps[1] : hudSteps[0];
  const outdoorRouteEndCoordinate = useMemo(() => {
    const decodeLast = (
      encoded?: string,
    ): { latitude: number; longitude: number } | null => {
      if (!encoded) return null;
      try {
        const decoded = polyline.decode(encoded);
        if (!decoded.length) return null;
        const [latitude, longitude] = decoded[decoded.length - 1];
        return { latitude, longitude };
      } catch {
        return null;
      }
    };

    if (activeRoute?.steps?.length) {
      const lastStep = activeRoute.steps[activeRoute.steps.length - 1];
      const stepEnd = decodeLast(lastStep?.polyline);
      if (stepEnd) return stepEnd;
    }
    return decodeLast(activeRoute?.polyline);
  }, [activeRoute]);

  const parseDistanceMeters = (value: string): number | null => {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    const kmMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*km$/);
    if (kmMatch) return Number(kmMatch[1]) * 1000;
    const meterMatch = normalized.match(/^(\d+(?:\.\d+)?)\s*m$/);
    if (meterMatch) return Number(meterMatch[1]);
    return null;
  };
  const outdoorArrivalDistance = useMemo(() => {
    if (!isNavigating || !currentLocation) {
      return Number.POSITIVE_INFINITY;
    }

    const distanceToDestinationPin = destination
      ? haversineDistance(currentLocation, {
          latitude: destination.latitude,
          longitude: destination.longitude,
        })
      : Number.POSITIVE_INFINITY;
    const distanceToRouteEnd = outdoorRouteEndCoordinate
      ? haversineDistance(currentLocation, outdoorRouteEndCoordinate)
      : Number.POSITIVE_INFINITY;
    const remainingOutdoorMeters = parseDistanceMeters(pathDistance);

    return Math.min(
      distanceToDestinationPin,
      distanceToRouteEnd,
      remainingOutdoorMeters ?? Number.POSITIVE_INFINITY,
    );
  }, [
    currentLocation,
    destination,
    isNavigating,
    outdoorRouteEndCoordinate,
    pathDistance,
  ]);
  const hasReachedOutdoorDestination =
    outdoorArrivalDistance <= EVENT_INDOOR_HANDOFF_DISTANCE_METERS;
  const outdoorArrivalActionLabel = activeEventIndoorTarget
    ? "Continue Inside"
    : "I Have Arrived";
  const showNavigatingUi = isNavigating && !navigationUiDismissed;
  const showCancellingUi = isCancellingNavigation && !navigationUiDismissed;
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

  // Keep user centered on map and follow orientation during active navigation
  useEffect(() => {
    if (isNavigating && currentLocation && mapReady) {
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          heading: currentHeading ?? 0,
          pitch: 45,
          zoom: 18,
        },
        { duration: 1000 },
      );
    }
  }, [currentLocation, currentHeading, isNavigating, mapReady]);

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
        : tabBarStyle;

    navigation.setOptions({ tabBarStyle: style });

    navigation.getParent()?.setOptions({ tabBarStyle: style });
  }, [
    isConfiguring,
    isNavigating,
    isCancellingNavigation,
    navigation,
    tabBarStyle,
  ]);

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
        params: {
          buildingId: selectedBuildingId,
          floor: defaultFloor,
          startRoom: "",
          endRoom: "",
          resumeOutdoorNavigation: "0",
          resumeOutdoorNavigationToken: "",
          navigationKey: Date.now().toString(),
        },
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
          label: normalizeCurrentLocationLabel(label),
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
    setActiveEventIndoorTarget(null);
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
    setPendingIndoorExitTarget(null);
    setShowIndoorFallbackNotice(false);
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
        buildingId: b.id,
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
    eventIndoorTarget: EventIndoorTarget | null = null,
    indoorExitTarget: IndoorExitTarget | null = null,
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
      setActiveEventIndoorTarget(eventIndoorTarget);
      setPendingIndoorExitTarget(indoorExitTarget);
      setShowIndoorFallbackNotice(false);
      setNavigationUiDismissed(false);
    } catch (error) {
      console.error("Error fetching directions:", error);
      Alert.alert(
        "Navigation error",
        "Could not fetch directions. Please try again.",
      );
      setActiveEventIndoorTarget(null);
      setPendingIndoorExitTarget(null);
      setShowIndoorFallbackNotice(false);
      setNavigationUiDismissed(false);
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
      buildingId: nearestBuilding.id,
    };
    const indoorExitTarget = hasIndoorMaps(nearestBuilding.id)
      ? getIndoorExitTarget(nearestBuilding.id)
      : null;
    setShowIndoorFallbackNotice(indoorExitTarget == null);

    await proceedWithDirections(
      originCoords,
      pendingDestination,
      pendingDestination.eventIndoorTarget ?? null,
      indoorExitTarget,
    );
    setPendingDestination(null);
  };

  const handleLocationPromptOutside = async () => {
    setShowLocationPrompt(false);
    if (!pendingDestination || !currentLocation) return;
    setShowIndoorFallbackNotice(false);

    const label = await reverseGeocode(currentLocation).catch(
      () => "Current Location",
    );

    const originCoords = {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      label: normalizeCurrentLocationLabel(label),
    };

    await proceedWithDirections(
      originCoords,
      pendingDestination,
      pendingDestination.eventIndoorTarget ?? null,
    );
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
      buildingId: selectedBuilding.id,
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
    eventIndoorTarget: EventIndoorTarget | null = null,
  ) => {
    const labeledDestCoords = {
      latitude: destCoords.latitude,
      longitude: destCoords.longitude,
      label: destinationLabel,
      buildingId: destinationBuildingId as BuildingId | undefined,
    };

    if (
      destinationBuildingId
        ? shouldPromptForSelectedBuilding(
            destinationBuildingId,
            labeledDestCoords,
            eventIndoorTarget,
          )
        : shouldPromptForNearbyBuilding(
            destCoords,
            labeledDestCoords,
            eventIndoorTarget,
          )
    ) {
      return;
    }

    const originCoords = await getDirectionsOrigin(destCoords);

    await proceedWithDirections(
      originCoords,
      labeledDestCoords,
      eventIndoorTarget,
    );
  };

  function shouldPromptForNearbyBuilding(
    destCoords: { latitude: number; longitude: number },
    labeledDestCoords: {
      latitude: number;
      longitude: number;
      label: string;
    },
    eventIndoorTarget: EventIndoorTarget | null = null,
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

    setPendingDestination({
      ...labeledDestCoords,
      eventIndoorTarget,
    });
    setShowLocationPrompt(true);
    return true;
  }

  function shouldPromptForSelectedBuilding(
    selectedBuildingId: string,
    destCoords: { latitude: number; longitude: number; label: string },
    eventIndoorTarget: EventIndoorTarget | null = null,
  ): boolean {
    if (
      !nearestBuilding ||
      nearestBuildingDistance === null ||
      nearestBuildingDistance >= NEARBY_BUILDING_THRESHOLD_METERS ||
      nearestBuilding.id === selectedBuildingId
    ) {
      return false;
    }

    setPendingDestination({
      ...destCoords,
      eventIndoorTarget,
    });
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

  const onPressEventDirections = async ({
    locationText,
    detailsText,
  }: EventDirectionsRequest) => {
    try {
      const eventIndoorTarget = await buildEventIndoorTarget({
        locationText,
        detailsText,
      });
      const maybeCoords = parseLatLng(locationText);
      if (maybeCoords) {
        await routeToDestination(
          maybeCoords,
          "Selected Location",
          undefined,
          eventIndoorTarget,
        );
        return;
      }

      const localBuildingMatch = findBuildingFromLocationText(locationText);
      if (localBuildingMatch) {
        await routeToDestination(
          localBuildingMatch.marker,
          localBuildingMatch.name,
          localBuildingMatch.id,
          eventIndoorTarget,
        );
        return;
      }

      const searchAnchor =
        currentLocation ?? (campus === "SGW" ? SGW_CENTER : LOYOLA_CENTER);
      const results = await searchLocations(
        locationText,
        searchAnchor.latitude,
        searchAnchor.longitude,
      );
      const firstWithCoords = results.find(
        (place: any) =>
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
        undefined,
        eventIndoorTarget,
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
    setPendingIndoorExitTarget(null);
    setShowIndoorFallbackNotice(false);

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
    if (pendingIndoorExitTarget) {
      const target = pendingIndoorExitTarget;
      setPendingIndoorExitTarget(null);
      setShowIndoorFallbackNotice(false);
      setNavigationState(NAVIGATION_STATE.IDLE);
      setToggleNavigationInfoState("minimize");
      setToggleNavigationHUDState("minimize");
      requestAnimationFrame(() => {
        router.push({
          pathname: "/indoor-navigation",
          params: {
            buildingId: target.buildingId,
            floor: target.floor,
            endRoom: target.exitRoom,
            resumeOutdoorNavigation: "1",
            resumeOutdoorNavigationToken: `${Date.now()}`,
            navigationKey: Date.now().toString(),
          },
        });
      });
      return;
    }

    if (showIndoorFallbackNotice) {
      Alert.alert(
        "Indoor Maps Unavailable",
        "No indoor maps for this building. Regular outdoor navigation started.",
      );
      setShowIndoorFallbackNotice(false);
    }

    navigatingRef.current = true;
    setNavigationUiDismissed(false);
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
    setNavigationUiDismissed(false);
    setNavigationState(NAVIGATION_STATE.NAVIGATING);
  };

  const handleCancelTrip = () => {
    indoorHandoffInFlightRef.current = false;
    navigatingRef.current = false;
    setIsLoading(false);
    setNavigationUiDismissed(true);
    setNavigationState(NAVIGATION_STATE.IDLE);
    setToggleNavigationInfoState("minimize");
    setToggleNavigationHUDState("minimize");
    setPathDistance("0");
    setPathDuration("0");
    setAllOutdoorRoutes([]);
    resetNavigationProgress();
    setActiveEventIndoorTarget(null);
    setPendingIndoorExitTarget(null);
    setShowIndoorFallbackNotice(false);
    clear();
  };

  const triggerIndoorHandoff = useCallback(
    (target: EventIndoorTarget) => {
      const outdoorOrigin = origin;
      const outdoorDestination = destination;
      const outdoorMode = navigationMode;

      indoorHandoffInFlightRef.current = true;
      handleCancelTrip();

      if (!target.floorSupported || !target.floor) {
        Alert.alert(
          "Indoor directions unavailable",
          "Floor for your next class is not supported.",
        );
        return;
      }

      const initialIndoorFloor = target.startFloor ?? target.floor;
      const params: Record<string, string> = {
        buildingId: target.buildingId,
        floor: initialIndoorFloor,
        forceBuildingId: "1",
        navigationKey: Date.now().toString(),
      };
      if (target.startRoom) params.startRoom = target.startRoom;
      if (target.destinationRoom) params.endRoom = target.destinationRoom;
      if (target.globalOriginRoom)
        params.globalOriginRoom = target.globalOriginRoom;
      if (target.globalOriginBuildingId) {
        params.globalOriginBuildingId = target.globalOriginBuildingId;
      }
      if (target.globalDestinationRoom) {
        params.globalDestinationRoom = target.globalDestinationRoom;
      }
      if (target.globalDestinationBuildingId) {
        params.globalDestinationBuildingId = target.globalDestinationBuildingId;
      }
      if (outdoorOrigin && outdoorDestination) {
        params.returnOutdoorOriginLat = `${outdoorOrigin.latitude}`;
        params.returnOutdoorOriginLng = `${outdoorOrigin.longitude}`;
        params.returnOutdoorOriginLabel = outdoorOrigin.label;
        if (outdoorOrigin.buildingId) {
          params.returnOutdoorOriginBuildingId = outdoorOrigin.buildingId;
        }

        params.returnOutdoorDestinationLat = `${outdoorDestination.latitude}`;
        params.returnOutdoorDestinationLng = `${outdoorDestination.longitude}`;
        params.returnOutdoorDestinationLabel = outdoorDestination.label;
        if (outdoorDestination.buildingId) {
          params.returnOutdoorDestinationBuildingId =
            outdoorDestination.buildingId;
        }

        params.returnOutdoorMode = outdoorMode;
      }

      requestAnimationFrame(() => {
        router.push({
          pathname: "/indoor-navigation",
          params,
        });
      });
    },
    [destination, handleCancelTrip, navigationMode, origin, router],
  );

  useEffect(() => {
    if (!isNavigating) {
      indoorHandoffInFlightRef.current = false;
      return;
    }

    if (navigationUiDismissed) {
      setNavigationUiDismissed(false);
    }
  }, [isNavigating, navigationUiDismissed]);

  const handleOutdoorArrivalAction = useCallback(() => {
    if (activeEventIndoorTarget) {
      triggerIndoorHandoff(activeEventIndoorTarget);
      return;
    }

    handleCancelTrip();
  }, [activeEventIndoorTarget, handleCancelTrip, triggerIndoorHandoff]);

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
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.enableLocationContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.enableLocationIconCircle,
              { backgroundColor: colors.primary + "2E" },
            ]}
          >
            <Text style={styles.enableLocationIcon}>
              {isRevoked ? "⚠️" : "📍"}
            </Text>
          </View>
          <Text style={[styles.enableLocationTitle, { color: colors.text }]}>
            {isRevoked
              ? "Location Permission Revoked"
              : "Enable Location Services"}
          </Text>
          <Text
            style={[styles.enableLocationSubtitle, { color: colors.textMuted }]}
          >
            {isRevoked
              ? "Location access was previously granted but has been revoked. Please re-enable in settings."
              : "To help you navigate Concordia's campus, we need access to your location."}
          </Text>
          <View style={styles.enableLocationBullets}>
            <Text
              style={[styles.enableLocationBullet, { color: colors.textMuted }]}
            >
              • Real-time positioning on the map
            </Text>
            <Text
              style={[styles.enableLocationBullet, { color: colors.textMuted }]}
            >
              • Turn-by-turn directions
            </Text>
            <Text
              style={[styles.enableLocationBullet, { color: colors.textMuted }]}
            >
              • Nearby points of interest
            </Text>
          </View>
          {shouldShowOSPrompt ? (
            <Pressable
              style={[
                styles.enableLocationBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => void onEnableLocation()}
            >
              <Text style={styles.enableLocationBtnText}>Enable Location</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[
                styles.enableLocationBtn,
                { backgroundColor: colors.primary },
              ]}
              onPress={() => void openSettings()}
            >
              <Text style={styles.enableLocationBtnText}>Open Settings</Text>
            </Pressable>
          )}
          <Pressable
            style={styles.enableLocationSkip}
            onPress={() => void onSkipLocation()}
          >
            <Text
              style={[
                styles.enableLocationSkipText,
                { color: colors.textMuted },
              ]}
            >
              {isRevoked ? "Continue without location" : "Skip for now"}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <MapView
        key={isDark ? "map-dark" : "map-light"}
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        customMapStyle={isDark ? DARK_MAP_STYLE : undefined}
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
            pinColor={colors.primary}
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
            strokeColor={colors.primary}
            strokeWidth={3}
            fillColor={`${colors.primary}1F`}
          />
        )}

        {!isSearching &&
          (isConfiguring || showNavigatingUi || showCancellingUi) && (
            <DirectionPath destination={destination} />
          )}
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
            showNavigatingUi ||
            showCancellingUi) &&
            styles.overlayHidden,
        ]}
        pointerEvents={
          !shouldShowEnableLocation &&
          !(isConfiguring || showNavigatingUi || showCancellingUi)
            ? "auto"
            : "none"
        }
      >
        <UpcomingEventButton
          onMainButtonPress={() => setShowBuildingPopup(false)}
          onRequestDirections={(payload) => {
            void onPressEventDirections(payload);
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
          onPress={() => {
            if (!isSearching) {
              setNavigationState(NAVIGATION_STATE.SEARCHING);
            }
          }}
          isConfiguring={isConfiguring}
          isNavigating={showNavigatingUi}
          isCancellingNavigation={showCancellingUi}
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
          navigationHUDStep={showNavigatingUi ? hudTopStep : undefined}
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
      {!showCancellingUi && (
        <FloatingActionButton onPress={() => void onPressFab()} />
      )}

      <View
        style={[
          styles.campusWrapper,
          (showNavigatingUi || showCancellingUi) && styles.overlayHidden,
        ]}
        pointerEvents={showNavigatingUi || showCancellingUi ? "none" : "auto"}
      >
        <CampusSwitcher value={campus} onChange={onChangeCampus} />
      </View>
      {showNavigatingUi && isRerouting && (
        <View style={styles.reroutingBanner}>
          <Text style={styles.reroutingText}>Recalculating route...</Text>
        </View>
      )}
      {showNavigatingUi && hasReachedOutdoorDestination && (
        <View style={styles.arrivalActionContainer} pointerEvents="box-none">
          <Pressable
            testID="outdoor-arrival-action"
            style={[
              styles.arrivalActionButton,
              {
                backgroundColor: colors.card,
                borderColor: colors.primary,
              },
            ]}
            onPress={handleOutdoorArrivalAction}
          >
            <Text style={[styles.arrivalActionText, { color: colors.primary }]}>
              {outdoorArrivalActionLabel}
            </Text>
          </Pressable>
        </View>
      )}
      <NavigationDirectionHUDBottom
        visible={showNavigatingUi}
        steps={hudSteps}
        onSnapIndexChange={handleHUDSnapIndexChange}
      />
      <NavigationInfoBottom
        visible={showNavigatingUi}
        onClose={() => {
          navigatingRef.current = false;
        }}
        onPressAction={onToggleNavigationInfoState}
        onSnapIndexChange={handleInfoSnapIndexChange}
      />

      {showCancellingUi && (
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
  root: { flex: 1 },
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
  arrivalActionContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 160,
    alignItems: "center",
  },
  arrivalActionButton: {
    minWidth: 220,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  arrivalActionText: {
    fontWeight: "700",
    fontSize: 16,
    textAlign: "center",
  },
});
