import { useEffect, useRef, useCallback, useState } from "react";
import polyline from "@mapbox/polyline";
import { getDistanceToPolyline } from "../utils/locationUtils";
import { getAllOutdoorDirectionsInfo } from "../api";
import useLocationStore from "./useLocationStore";
import useNavigationState from "./useNavigationState";
import useNavigationConfig from "./useNavigationConfig";
import {
  LabeledCoordinate,
  useNavigationEndpointsStore,
} from "./useNavigationEndpoints";
import useNavigationInfo from "./useNavigationInfo";
import useNavigationProgress from "./useNavigationProgress";
import { Coordinate, TRANSPORT_MODE_API_MAP } from "../type";

const OFF_ROUTE_THRESHOLD_METERS = 50;
const REROUTE_COOLDOWN_MS = 15000;
const OFF_ROUTE_CONFIRMATION_COUNT = 3;
const OFF_ROUTE_CHECK_INTERVAL_MS = 1000;

const decodePolyline = (encoded: string): Coordinate[] => {
  return polyline
    .decode(encoded)
    .map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
};

export default function useRerouting() {
  const [isRerouting, setIsRerouting] = useState(false);

  const offRouteCountRef = useRef(0);
  const reroutingRef = useRef(false);
  const lastRerouteTimeRef = useRef<number>(0);
  const routeCoordsRef = useRef<Coordinate[]>([]);
  const stepStartIndicesRef = useRef<number[]>([]);
  const isOffRouteRef = useRef(false);
  const navigationSessionRef = useRef(0);

  const currentLocation = useLocationStore((s) => s.currentLocation);
  const { isNavigating } = useNavigationState();

  // Use selectors for stable references
  const allOutdoorRoutes = useNavigationConfig((s) => s.allOutdoorRoutes);
  const setAllOutdoorRoutes = useNavigationConfig((s) => s.setAllOutdoorRoutes);
  const navigationMode = useNavigationConfig((s) => s.navigationMode);

  const setOrigin = useNavigationEndpointsStore((s) => s.setOrigin);

  const setPathDistance = useNavigationInfo((s) => s.setPathDistance);
  const setPathDuration = useNavigationInfo((s) => s.setPathDuration);
  const setIsLoading = useNavigationInfo((s) => s.setIsLoading);

  const resetProgress = useNavigationProgress((s) => s.resetProgress);

  useEffect(() => {
    if (!allOutdoorRoutes?.length) {
      routeCoordsRef.current = [];
      stepStartIndicesRef.current = [];
      return;
    }

    const apiMode = TRANSPORT_MODE_API_MAP[navigationMode];
    const route = allOutdoorRoutes.find(
      (r) => r.transportMode?.toLowerCase() === apiMode?.toLowerCase(),
    );

    if (!route) {
      routeCoordsRef.current = [];
      stepStartIndicesRef.current = [];
      return;
    }

    if (route.steps?.length) {
      const coords: Coordinate[] = [];
      const starts: number[] = [];
      for (const step of route.steps) {
        starts.push(coords.length);
        coords.push(...decodePolyline(step.polyline));
      }
      routeCoordsRef.current = coords;
      stepStartIndicesRef.current = starts;
    } else if (route.polyline) {
      routeCoordsRef.current = decodePolyline(route.polyline);
      stepStartIndicesRef.current = [0];
    } else {
      routeCoordsRef.current = [];
      stepStartIndicesRef.current = [];
    }
  }, [allOutdoorRoutes, navigationMode]);

  const triggerReroute = useCallback(async () => {
    if (reroutingRef.current) return;

    const location = useLocationStore.getState().currentLocation;
    const dest = useNavigationEndpointsStore.getState().destination;
    if (!location || !dest) {
      isOffRouteRef.current = false;
      offRouteCountRef.current = 0;
      return;
    }

    const now = Date.now();
    if (now - lastRerouteTimeRef.current < REROUTE_COOLDOWN_MS) {
      isOffRouteRef.current = false;
      offRouteCountRef.current = 0;
      return;
    }

    const sessionAtStart = navigationSessionRef.current;
    reroutingRef.current = true;
    setIsRerouting(true);
    setIsLoading(true);

    try {
      const newOrigin: LabeledCoordinate = {
        latitude: location.latitude,
        longitude: location.longitude,
        label: "Current Location",
      };

      if (navigationSessionRef.current !== sessionAtStart) return;

      setOrigin(newOrigin);

      const routes = await getAllOutdoorDirectionsInfo(newOrigin, dest);

      if (navigationSessionRef.current !== sessionAtStart) return;

      setAllOutdoorRoutes(routes);

      const mode = useNavigationConfig.getState().navigationMode;
      const activeRoute =
        routes.find(
          (r) =>
            r.transportMode?.toLowerCase() ===
            TRANSPORT_MODE_API_MAP[mode]?.toLowerCase(),
        ) || routes[0];

      if (activeRoute) {
        setPathDistance(activeRoute.distance);
        setPathDuration(activeRoute.duration);
      }

      lastRerouteTimeRef.current = Date.now();
      resetProgress();
    } catch (error) {
      console.error("[Rerouting] Reroute failed:", error);
    } finally {
      reroutingRef.current = false;
      isOffRouteRef.current = false;
      offRouteCountRef.current = 0;
      setIsRerouting(false);
      setIsLoading(false);
    }
  }, [
    setOrigin,
    setAllOutdoorRoutes,
    setPathDistance,
    setPathDuration,
    setIsLoading,
    resetProgress,
  ]);

  const evaluateOffRoute = useCallback(
    (location: Coordinate | null) => {
      if (!isNavigating || !location) {
        offRouteCountRef.current = 0;
        isOffRouteRef.current = false;
        return;
      }

      if (routeCoordsRef.current.length === 0 || reroutingRef.current) return;

      const stepIdx = useNavigationProgress.getState().currentStepIndex;
      const startAt = stepStartIndicesRef.current[stepIdx] ?? 0;
      const remainingCoords = routeCoordsRef.current.slice(startAt);

      if (remainingCoords.length === 0) return;

      const distance = getDistanceToPolyline(location, remainingCoords);

      if (distance > OFF_ROUTE_THRESHOLD_METERS) {
        offRouteCountRef.current += 1;
        if (
          offRouteCountRef.current >= OFF_ROUTE_CONFIRMATION_COUNT &&
          !isOffRouteRef.current
        ) {
          isOffRouteRef.current = true;
          triggerReroute();
        }
      } else {
        offRouteCountRef.current = 0;
        isOffRouteRef.current = false;
      }
    },
    [isNavigating, triggerReroute],
  );

  useEffect(() => {
    evaluateOffRoute(currentLocation);
  }, [currentLocation, evaluateOffRoute]);

  useEffect(() => {
    if (!isNavigating) return;

    const interval = setInterval(() => {
      evaluateOffRoute(useLocationStore.getState().currentLocation);
    }, OFF_ROUTE_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isNavigating, evaluateOffRoute]);

  useEffect(() => {
    if (!isNavigating) {
      navigationSessionRef.current += 1;
      isOffRouteRef.current = false;
      offRouteCountRef.current = 0;
      if (reroutingRef.current) {
        reroutingRef.current = false;
        setIsRerouting(false);
      }
    }
  }, [isNavigating]);

  return { isRerouting };
}
