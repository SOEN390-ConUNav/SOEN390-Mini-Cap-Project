import React, { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation, useLocalSearchParams, useRouter } from "expo-router";
import {
  hasIndoorMaps,
  getAvailableFloors,
  getDefaultFloor,
} from "../../utils/buildingIndoorMaps";
import MapView, {
  Marker,
  Polygon,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import polyline from "@mapbox/polyline";
import * as Location from "expo-location";
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
import { getAvailableRooms } from "../../api/indoorDirectionsApi";
import { NamedCoordinate, TRANSPORT_MODE_API_MAP } from "../../type";
import { reverseGeocode } from "../../services/handleGeocode";
import { findBuildingFromLocationText } from "../../utils/eventLocationBuildingMatcher";
import {
  parseIndoorEventInfo,
  pickEntranceRoom,
  resolveClassroomForFloor,
} from "../../utils/eventIndoorNavigation";
import NavigationInfoBottom from "../../components/navigation-info/NavigationInfoBottom";
import NavigationDirectionHUDBottom from "../../components/navigation-direction/NavigationDirectionHUDBottom";
import NavigationCancelBottom from "../../components/navigation-cancel/NavigationCancelBottom";

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
const ARRIVAL_DISTANCE_THRESHOLD_METERS = 10;
const LIVE_REROUTE_MIN_INTERVAL_MS = 3000;
const LIVE_REROUTE_MIN_MOVE_METERS = 10;

type EventDetailsPayload = {
  title: string;
  detailsText: string;
  showDirections: boolean;
  accessibility?: Accessibility;
  onDirections: () => void;
  onChangeCalendar: () => void;
  onLogout: () => void;
};

type PendingEventIndoorTarget = {
  buildingId: BuildingId;
  destination: { latitude: number; longitude: number };
  floor: string;
  classroom: string;
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
  const { allOutdoorRoutes, setAllOutdoorRoutes, navigationMode } =
    useNavigationConfig();
  const { setIsLoading, setPathDistance, setPathDuration } =
    useNavigationInfo();
  const [toggleNavigationInfoState, setToggleNavigationInfoState] = useState<
    "maximize" | "minimize"
  >("minimize");
  const [toggleNavigationHUDState, setToggleNavigationHUDState] = useState<
    "maximize" | "minimize"
  >("minimize");

  const [hasLocationPermission, setHasLocationPermission] = useState<
    boolean | null
  >(null);
  const [showEnableLocation, setShowEnableLocation] = useState(true);

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
  const [pendingEventIndoorTarget, setPendingEventIndoorTarget] =
    useState<PendingEventIndoorTarget | null>(null);

  const [mapReady, setMapReady] = useState(false);
  const [freezeMarkers, setFreezeMarkers] = useState(false);
  const freezeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mapRef = useRef<MapView>(null);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  const navigatingRef = useRef(false);
  const arrivalHandlingRef = useRef(false);
  const isNavigatingRef = useRef(isNavigating);
  const destinationRef = useRef(destination);
  const navigationModeRef = useRef(navigationMode);
  const allOutdoorRoutesRef = useRef(allOutdoorRoutes);
  const routeArrivalTargetRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const rerouteInFlightRef = useRef(false);
  const lastRerouteAtRef = useRef(0);
  const lastRerouteOriginRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const latestLocationRef = useRef<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  useEffect(() => {
    arrivalHandlingRef.current = false;
  }, [pendingEventIndoorTarget]);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  useEffect(() => {
    destinationRef.current = destination;
  }, [destination]);

  useEffect(() => {
    navigationModeRef.current = navigationMode;
  }, [navigationMode]);

  useEffect(() => {
    allOutdoorRoutesRef.current = allOutdoorRoutes;
    routeArrivalTargetRef.current = getActiveRouteEndpoint();
  }, [allOutdoorRoutes]);

  useEffect(() => {
    routeArrivalTargetRef.current = getActiveRouteEndpoint();
  }, [navigationMode]);

  // ── Derive active route steps for the HUD ──────────────────────────────
  const activeRoute =
    allOutdoorRoutes?.find(
      (r) => r.transportMode?.toUpperCase() === navigationMode?.toUpperCase(),
    ) ??
    allOutdoorRoutes?.[0] ??
    null;

  const hudSteps = activeRoute?.steps ?? [];
  const hudTopStep = hudSteps[0];
  // ───────────────────────────────────────────────────────────────────────

  // When navigation starts, clear UI clutter + zoom to user ──────
  useEffect(() => {
    if (!isNavigating) {
      rerouteInFlightRef.current = false;
      lastRerouteAtRef.current = 0;
      lastRerouteOriginRef.current = null;
      latestLocationRef.current = null;
      routeArrivalTargetRef.current = null;
      return;
    }
    setShowBuildingPopup(false);
    setSelectedBuildingId(null);
    setOutlineMode(false);
    getOneFix()
      .then((fix) => {
        const currentCoords = {
          latitude: fix.latitude,
          longitude: fix.longitude,
        };
        animateToRegion({ ...fix, ...NAVIGATION_ZOOM });
        lastRerouteOriginRef.current = currentCoords;
        lastRerouteAtRef.current = Date.now();
        void refreshOutdoorRouteFromCurrentLocation(currentCoords);
      })
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
    if (!shuttleStop || showEnableLocation || !mapReady) return;
    requestAnimationFrame(() => {
      animateToRegion({
        latitude: shuttleStop.coordinate.latitude,
        longitude: shuttleStop.coordinate.longitude,
        ...CAMPUS_REGION_DELTA,
      });
    });
    scheduleFreezeMarkers();
  }, [shuttleStop, showEnableLocation, mapReady]);

  useEffect(() => {
    scheduleFreezeMarkers();
    return () => {
      if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    };
  }, [showEnableLocation]);

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
  }, [mapReady, showEnableLocation, isConfiguring, isNavigating]);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    const granted = status === "granted";
    setHasLocationPermission(granted);
    if (granted) {
      setShowEnableLocation(false);
      await startWatchingLocation();
    }
  };

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

  const stopWatchingLocation = () => {
    locationSubRef.current?.remove();
    locationSubRef.current = null;
  };

  const startWatchingLocation = async () => {
    if (locationSubRef.current) return;
    try {
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          if (!isNavigatingRef.current) return;
          if (!destinationRef.current) return;

          const currentCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy ?? 0,
          };
          latestLocationRef.current = currentCoords;
          const now = Date.now();
          const elapsedSinceReroute = now - lastRerouteAtRef.current;
          const movedSinceReroute = lastRerouteOriginRef.current
            ? getDistanceMeters(currentCoords, lastRerouteOriginRef.current)
            : Number.POSITIVE_INFINITY;

          if (
            elapsedSinceReroute < LIVE_REROUTE_MIN_INTERVAL_MS &&
            movedSinceReroute < LIVE_REROUTE_MIN_MOVE_METERS
          ) {
            return;
          }

          void refreshOutdoorRouteFromCurrentLocation(currentCoords);
        },
      );
    } catch (error) {
      console.error("Error watching location:", error);
    }
  };

  const getOneFix = async (): Promise<Region> => {
    const current = await Location.getCurrentPositionAsync({});
    return {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
      ...CAMPUS_REGION_DELTA,
    };
  };

  const animateToRegion = (r: Region) => {
    mapRef.current?.animateToRegion(r, 650);
  };

  const toRadians = (value: number) => (value * Math.PI) / 180;

  const getDistanceMeters = (
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
  ) => {
    const earthRadius = 6371000;
    const dLat = toRadians(to.latitude - from.latitude);
    const dLng = toRadians(to.longitude - from.longitude);
    const lat1 = toRadians(from.latitude);
    const lat2 = toRadians(to.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const decodeRouteEndCoordinate = (encodedPolyline?: string) => {
    if (!encodedPolyline) return null;
    try {
      const points = polyline.decode(encodedPolyline);
      if (!points.length) return null;
      const [lat, lng] = points[points.length - 1];
      return { latitude: lat, longitude: lng };
    } catch {
      return null;
    }
  };

  const getActiveRouteEndpoint = () => {
    const routes = allOutdoorRoutesRef.current ?? [];
    if (!routes.length) return null;

    const desiredMode = TRANSPORT_MODE_API_MAP[navigationModeRef.current];
    const active =
      routes.find(
        (route) =>
          route.transportMode?.toLowerCase() === desiredMode?.toLowerCase(),
      ) ?? routes[0];

    const stepEndpoint = active.steps?.length
      ? decodeRouteEndCoordinate(
          active.steps[active.steps.length - 1]?.polyline,
        )
      : null;
    return stepEndpoint ?? decodeRouteEndCoordinate(active.polyline);
  };

  const refreshOutdoorRouteFromCurrentLocation = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    const activeDestination = destinationRef.current;
    if (!activeDestination || rerouteInFlightRef.current) return;

    rerouteInFlightRef.current = true;
    try {
      const newOrigin = {
        latitude: coords.latitude,
        longitude: coords.longitude,
        label: "Current Location",
      };
      const destinationCoords = {
        latitude: activeDestination.latitude,
        longitude: activeDestination.longitude,
        label: activeDestination.label ?? "Selected Location",
      };

      setOrigin(newOrigin);
      const routes = await getAllOutdoorDirectionsInfo(
        newOrigin,
        destinationCoords,
      );
      if (!routes.length) return;

      setAllOutdoorRoutes(routes);
      allOutdoorRoutesRef.current = routes;
      routeArrivalTargetRef.current = getActiveRouteEndpoint();

      const routeForMetrics =
        routes.find(
          (r) =>
            r.transportMode?.toUpperCase() ===
            navigationModeRef.current?.toUpperCase(),
        ) ??
        routes.find((r) => r.transportMode?.toUpperCase() === "WALKING") ??
        routes[0];

      if (routeForMetrics) {
        setPathDistance(routeForMetrics.distance);
        setPathDuration(routeForMetrics.duration);
      }

      lastRerouteAtRef.current = Date.now();
      lastRerouteOriginRef.current = {
        latitude: coords.latitude,
        longitude: coords.longitude,
      };
    } catch (error) {
      console.warn("Live reroute failed:", error);
    } finally {
      rerouteInFlightRef.current = false;
    }
  };

  const scheduleFreezeMarkers = () => {
    if (freezeTimerRef.current) clearTimeout(freezeTimerRef.current);
    setFreezeMarkers(false);
    if (!mapReady || showEnableLocation) return;
    freezeTimerRef.current = setTimeout(
      () => setFreezeMarkers(true),
      FREEZE_MARKERS_AFTER_MS,
    );
  };

  const onPressFab = async () => {
    try {
      setEventDetails(null);
      if (hasLocationPermission === true) {
        animateToRegion(await getOneFix());
        return;
      }
      setShowEnableLocation(true);
    } catch {
      Alert.alert("Location error", "Could not center the map.");
    }
  };

  const onEnableLocation = async () => {
    try {
      const granted = await Location.requestForegroundPermissionsAsync().then(
        ({ status }) => status === "granted",
      );
      if (!granted) {
        Alert.alert(
          "Permission denied",
          "You can enable location later in device settings.",
        );
        return;
      }
      setHasLocationPermission(true);
      setShowEnableLocation(false);
      animateToRegion(await getOneFix());
      await startWatchingLocation();
    } catch {
      Alert.alert("Location error", "Could not retrieve your location.");
    }
  };

  const onSkipLocation = () => {
    setShowEnableLocation(false);
    setHasLocationPermission(false);
    stopWatchingLocation();
  };

  const onChangeCampus = (next: "SGW" | "LOYOLA") => {
    setEventDetails(null);
    setPendingEventIndoorTarget(null);
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
    setPendingEventIndoorTarget(null);
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

  const onPressDirections = async () => {
    setShowBuildingPopup(false);
    setPendingEventIndoorTarget(null);
    if (!selectedBuilding) return;

    setIsLoading(true);
    setNavigationState(NAVIGATION_STATE.ROUTE_CONFIGURING);

    try {
      const currentLocation = await getOneFix();
      const label = await reverseGeocode(currentLocation).catch(
        () => "Current Location",
      );

      const originCoords = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        label,
      };
      const destCoords = {
        latitude: selectedBuilding.marker.latitude,
        longitude: selectedBuilding.marker.longitude,
        label: selectedBuilding.name,
      };

      setOrigin(originCoords);
      setDestination(destCoords);

      const routes = await getAllOutdoorDirectionsInfo(
        originCoords,
        destCoords,
      );
      setAllOutdoorRoutes(routes);
      allOutdoorRoutesRef.current = routes;
      routeArrivalTargetRef.current = getActiveRouteEndpoint();

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

  const routeToDestination = async (
    destCoords: {
      latitude: number;
      longitude: number;
    },
    destinationLabel = "Selected Location",
    eventIndoorTarget: PendingEventIndoorTarget | null = null,
  ) => {
    const currLocation = await getOneFix();
    const originCoords = {
      latitude: currLocation.latitude,
      longitude: currLocation.longitude,
      label: "Current Location",
    };
    const labeledDestCoords = {
      latitude: destCoords.latitude,
      longitude: destCoords.longitude,
      label: destinationLabel,
    };

    setOrigin(originCoords);
    setDestination(labeledDestCoords);
    setPendingEventIndoorTarget(null);
    const routes = await getAllOutdoorDirectionsInfo(
      originCoords,
      labeledDestCoords,
    );
    setAllOutdoorRoutes(routes);
    allOutdoorRoutesRef.current = routes;
    routeArrivalTargetRef.current = getActiveRouteEndpoint();
    setNavigationState(NAVIGATION_STATE.ROUTE_CONFIGURING);
    setPendingEventIndoorTarget(eventIndoorTarget);
  };

  const parseLatLng = (
    value: string,
  ): { latitude: number; longitude: number } | null => {
    const match = value.match(
      /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/,
    );
    if (!match) return null;
    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  };

  const onPressEventDirections = async ({
    locationText,
    detailsText,
  }: {
    locationText: string;
    detailsText: string;
  }) => {
    try {
      setPendingEventIndoorTarget(null);
      const maybeCoords = parseLatLng(locationText);
      if (maybeCoords) {
        await routeToDestination(maybeCoords);
        return;
      }

      const localBuildingMatch = findBuildingFromLocationText(locationText);
      if (localBuildingMatch) {
        const { classroom, floor } = parseIndoorEventInfo(
          locationText,
          detailsText,
          localBuildingMatch.id,
        );
        const pendingIndoorTarget =
          classroom && floor
            ? {
                buildingId: localBuildingMatch.id,
                destination: localBuildingMatch.marker,
                floor,
                classroom,
              }
            : null;
        await routeToDestination(
          localBuildingMatch.marker,
          localBuildingMatch.name,
          pendingIndoorTarget,
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

  const finishOutdoorNavigation = () => {
    navigatingRef.current = false;
    setIsLoading(false);
    setNavigationState(NAVIGATION_STATE.IDLE);
    setToggleNavigationInfoState("minimize");
    setToggleNavigationHUDState("minimize");
    setPathDistance("0");
    setPathDuration("0");
    setAllOutdoorRoutes([]);
    allOutdoorRoutesRef.current = [];
    routeArrivalTargetRef.current = null;
    clear();
  };

  const handleArrivedAtEventBuilding = async () => {
    if (!pendingEventIndoorTarget) return;

    const availableFloors = getAvailableFloors(
      pendingEventIndoorTarget.buildingId,
    );
    const isTargetFloorSupported = availableFloors.some(
      (f) => f.toUpperCase() === pendingEventIndoorTarget.floor.toUpperCase(),
    );

    if (!isTargetFloorSupported) {
      finishOutdoorNavigation();
      setPendingEventIndoorTarget(null);
      Alert.alert(
        "Indoor directions unavailable",
        "Floor for your next class is not supported.",
      );
      return;
    }

    let rooms: string[] = [];
    try {
      rooms = await getAvailableRooms(
        pendingEventIndoorTarget.buildingId,
        pendingEventIndoorTarget.floor,
      );
    } catch {
      rooms = [];
    }

    const resolvedDestinationRoom =
      rooms.length > 0
        ? (resolveClassroomForFloor(
            rooms,
            pendingEventIndoorTarget.buildingId,
            pendingEventIndoorTarget.floor,
            pendingEventIndoorTarget.classroom,
          ) ?? pendingEventIndoorTarget.classroom)
        : pendingEventIndoorTarget.classroom;
    const entranceRoom = rooms.length > 0 ? pickEntranceRoom(rooms) : null;

    finishOutdoorNavigation();
    setPendingEventIndoorTarget(null);

    router.push({
      pathname: "/indoor-navigation",
      params: {
        buildingId: pendingEventIndoorTarget.buildingId,
        floor: pendingEventIndoorTarget.floor,
        endRoom: resolvedDestinationRoom,
        ...(entranceRoom ? { startRoom: entranceRoom } : {}),
      },
    });
  };

  useEffect(() => {
    if (!isNavigating || !pendingEventIndoorTarget) return;

    let arrivalSub: Location.LocationSubscription | null = null;
    let cancelled = false;

    const startArrivalWatch = async () => {
      try {
        arrivalSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 800,
            distanceInterval: 0,
          },
          (location) => {
            if (cancelled || arrivalHandlingRef.current) return;

            const currentPosition = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy ?? 0,
            };
            latestLocationRef.current = currentPosition;

            const distanceToIndoorTarget = getDistanceMeters(
              currentPosition,
              pendingEventIndoorTarget.destination,
            );
            const activeDestination = destinationRef.current;
            const distanceToOutdoorDestination = activeDestination
              ? getDistanceMeters(currentPosition, {
                  latitude: activeDestination.latitude,
                  longitude: activeDestination.longitude,
                })
              : Number.POSITIVE_INFINITY;
            const routeEndpoint = routeArrivalTargetRef.current;
            const distanceToRouteEndpoint = routeEndpoint
              ? getDistanceMeters(currentPosition, routeEndpoint)
              : Number.POSITIVE_INFINITY;
            const effectiveThreshold =
              ARRIVAL_DISTANCE_THRESHOLD_METERS +
              Math.min(Math.max(currentPosition.accuracy ?? 0, 0), 25);
            const smallestDistance = Math.min(
              distanceToIndoorTarget,
              distanceToOutdoorDestination,
              distanceToRouteEndpoint,
            );

            if (smallestDistance > effectiveThreshold) return;

            arrivalHandlingRef.current = true;
            void handleArrivedAtEventBuilding().catch(() => {
              arrivalHandlingRef.current = false;
            });
          },
        );
      } catch {
        // If watch setup fails, keep fallback check below.
      }
    };

    void startArrivalWatch();

    const fallbackIntervalId = setInterval(async () => {
      if (arrivalHandlingRef.current) return;

      try {
        const latestCoords = latestLocationRef.current;
        let currentPosition = latestCoords;
        if (!currentPosition) {
          const currentFix = await Location.getCurrentPositionAsync({});
          currentPosition = {
            latitude: currentFix.coords.latitude,
            longitude: currentFix.coords.longitude,
            accuracy: currentFix.coords.accuracy ?? 0,
          };
        }
        const distanceToIndoorTarget = getDistanceMeters(
          currentPosition,
          pendingEventIndoorTarget.destination,
        );
        const activeDestination = destinationRef.current;
        const distanceToOutdoorDestination = activeDestination
          ? getDistanceMeters(currentPosition, {
              latitude: activeDestination.latitude,
              longitude: activeDestination.longitude,
            })
          : Number.POSITIVE_INFINITY;
        const routeEndpoint = routeArrivalTargetRef.current;
        const distanceToRouteEndpoint = routeEndpoint
          ? getDistanceMeters(currentPosition, routeEndpoint)
          : Number.POSITIVE_INFINITY;
        const effectiveThreshold =
          ARRIVAL_DISTANCE_THRESHOLD_METERS +
          Math.min(Math.max(currentPosition.accuracy ?? 0, 0), 25);
        const smallestDistance = Math.min(
          distanceToIndoorTarget,
          distanceToOutdoorDestination,
          distanceToRouteEndpoint,
        );

        if (smallestDistance > effectiveThreshold) return;

        arrivalHandlingRef.current = true;
        await handleArrivedAtEventBuilding();
      } catch {
        arrivalHandlingRef.current = false;
        // Ignore noisy location errors; we'll retry on next interval tick.
      }
    }, 1200);

    return () => {
      cancelled = true;
      arrivalSub?.remove();
      clearInterval(fallbackIntervalId);
    };
  }, [isNavigating, pendingEventIndoorTarget]);

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
    try {
      setPendingEventIndoorTarget(null);
      const currentPos = await Location.getCurrentPositionAsync({});

      const originCoords = {
        latitude: currentPos.coords.latitude,
        longitude: currentPos.coords.longitude,
        label: "Current Location",
      };
      const destCoords = {
        latitude,
        longitude,
        label: name ?? "Selected Location",
      };

      setOrigin(originCoords);
      setDestination(destCoords);

      const routes = await getAllOutdoorDirectionsInfo(
        originCoords,
        destCoords,
      );
      setAllOutdoorRoutes(routes);
      allOutdoorRoutesRef.current = routes;
      routeArrivalTargetRef.current = getActiveRouteEndpoint();

      setNavigationState(NAVIGATION_STATE.ROUTE_CONFIGURING);

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
    setPendingEventIndoorTarget(null);

    const newOrigin = destination;
    const newDest = origin;
    swap();

    try {
      const routes = await getAllOutdoorDirectionsInfo(newOrigin, newDest);
      setAllOutdoorRoutes(routes);
      allOutdoorRoutesRef.current = routes;
      routeArrivalTargetRef.current = getActiveRouteEndpoint();

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
    setPendingEventIndoorTarget(null);
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
    finishOutdoorNavigation();
    setPendingEventIndoorTarget(null);
    latestLocationRef.current = null;
  };

  const handleOpenSettings = () => {
    router.push("/settings");
  };

  if (showEnableLocation) {
    return (
      <View style={styles.root}>
        <View style={styles.enableLocationContainer}>
          <View style={styles.enableLocationIconCircle}>
            <Text style={styles.enableLocationIcon}>📍</Text>
          </View>
          <Text style={styles.enableLocationTitle}>
            Enable Location Services
          </Text>
          <Text style={styles.enableLocationSubtitle}>
            To help you navigate Concordia's campus, we need access to your
            location.
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
          <Pressable
            style={styles.enableLocationBtn}
            onPress={onEnableLocation}
          >
            <Text style={styles.enableLocationBtnText}>Enable Location</Text>
          </Pressable>
          <Pressable style={styles.enableLocationSkip} onPress={onSkipLocation}>
            <Text style={styles.enableLocationSkipText}>Skip for now</Text>
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
            setPendingEventIndoorTarget(null);
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
          (showEnableLocation ||
            isConfiguring ||
            isNavigating ||
            isCancellingNavigation) &&
            styles.overlayHidden,
        ]}
        pointerEvents={
          !showEnableLocation &&
          !(isConfiguring || isNavigating || isCancellingNavigation)
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
              setPendingEventIndoorTarget(null);
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
        onClose={() => {
          setPendingEventIndoorTarget(null);
          setNavigationState(NAVIGATION_STATE.IDLE);
        }}
        onSelectLocation={handleSelectLocation}
      />
      <NavigationConfigView
        durations={allOutdoorRoutes}
        visible={isConfiguring}
        onClose={() => handleCloseNavConfig()}
        onGo={() => handleGoNavConfig()}
      />
      {!isCancellingNavigation && <FloatingActionButton onPress={onPressFab} />}

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
          <NavigationDirectionHUDBottom
            visible={isNavigating}
            steps={hudSteps}
            onSnapIndexChange={(index) => {
              if (index < 0) return;
              setToggleNavigationHUDState(
                index === 1 ? "minimize" : "maximize",
              );
            }}
          />
          <NavigationInfoBottom
            visible={isNavigating}
            onClose={() => {
              navigatingRef.current = false;
            }}
            onPressAction={onToggleNavigationInfoState}
            onSnapIndexChange={(index) => {
              if (index < 0) return;
              setToggleNavigationInfoState(
                index === 1 ? "minimize" : "maximize",
              );
            }}
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
});
