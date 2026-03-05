import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import { Coordinate, TRANSPORT_MODE_API_MAP } from "../type";
import useNavigationConfig from "../hooks/useNavigationConfig";
import useNavigationState from "../hooks/useNavigationState";
import useLocationStore from "../hooks/useLocationStore";
import useNavigationProgress from "../hooks/useNavigationProgress";
import {
  inferStyleFromInstruction,
  BURGUNDY,
  POLYLINE_STYLES,
} from "../utils/polylineStyles";
import {
  haversineDistance,
  sumPolylineDistance,
  formatDistance,
} from "../utils/locationUtils";
import useNavigationInfo from "../hooks/useNavigationInfo";

const ON_ROUTE_THRESHOLD_METERS = 100;
const SEARCH_WINDOW_POINTS = 50;

interface DirectionPathProps {
  readonly destination: Coordinate | null;
}

function EndPin() {
  return (
    <View style={styles.endPin}>
      <Ionicons name="location" size={28} color={BURGUNDY} />
    </View>
  );
}

const decodeToCoords = (encoded: string): Coordinate[] =>
  polyline
    .decode(encoded)
    .map(([lat, lng]) => ({ latitude: lat, longitude: lng }));

interface RouteSegment {
  coordinates: Coordinate[];
  style: { color: string; dash?: number[] };
}

interface ProgressIndex {
  segmentIndex: number;
  pointIndex: number;
}

function flattenSegments(segments: RouteSegment[]): Coordinate[] {
  return segments.flatMap((seg) => seg.coordinates);
}

function toFlatIndex(
  segments: RouteSegment[],
  progress: ProgressIndex,
): number {
  let idx = 0;
  for (let s = 0; s < progress.segmentIndex; s++) {
    idx += segments[s].coordinates.length;
  }
  return idx + progress.pointIndex;
}

function fromFlatIndex(
  segments: RouteSegment[],
  flatIdx: number,
): ProgressIndex {
  let remaining = flatIdx;
  for (let s = 0; s < segments.length; s++) {
    const len = segments[s].coordinates.length;
    if (remaining < len) {
      return { segmentIndex: s, pointIndex: remaining };
    }
    remaining -= len;
  }
  const lastSeg = segments.length - 1;
  return {
    segmentIndex: lastSeg,
    pointIndex: Math.max(0, segments[lastSeg].coordinates.length - 1),
  };
}

function findClosestInWindow(
  userLocation: Coordinate,
  allCoords: Coordinate[],
  startFlatIdx: number,
  windowSize: number,
): { flatIndex: number; distance: number } | null {
  if (!allCoords.length) return null;

  let bestIdx = startFlatIdx;
  let bestDist = Infinity;

  const endIdx = Math.min(startFlatIdx + windowSize, allCoords.length);
  for (let i = startFlatIdx; i < endIdx; i++) {
    const dist = haversineDistance(userLocation, allCoords[i]);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }

  return { flatIndex: bestIdx, distance: bestDist };
}

function trimSegmentsFromProgress(
  segments: RouteSegment[],
  progress: ProgressIndex,
): RouteSegment[] {
  const { segmentIndex, pointIndex } = progress;
  const trimmed: RouteSegment[] = [];

  for (let i = segmentIndex; i < segments.length; i++) {
    const seg = segments[i];
    if (i === segmentIndex) {
      const coords = seg.coordinates.slice(pointIndex);
      if (coords.length > 0) {
        trimmed.push({ ...seg, coordinates: coords });
      }
    } else {
      trimmed.push(seg);
    }
  }

  return trimmed;
}

export default function DirectionPath({ destination }: DirectionPathProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const navigationMode = useNavigationConfig((s) => s.navigationMode);
  const allOutdoorRoutes = useNavigationConfig((s) => s.allOutdoorRoutes);
  const { isNavigating } = useNavigationState();
  const currentLocation = useLocationStore((state) => state.currentLocation);
  const currentSpeed = useLocationStore((state) => state.currentSpeed);
  const setCurrentStepIndex = useNavigationProgress(
    (s) => s.setCurrentStepIndex,
  );
  const setDistanceToNextStep = useNavigationProgress(
    (s) => s.setDistanceToNextStep,
  );
  const resetProgress = useNavigationProgress((s) => s.resetProgress);
  const setPathDistance = useNavigationInfo((s) => s.setPathDistance);
  const setPathDuration = useNavigationInfo((s) => s.setPathDuration);

  const progressRef = useRef<ProgressIndex>({ segmentIndex: 0, pointIndex: 0 });
  const lastStepIndexRef = useRef(0);
  const lastDistanceUpdateRef = useRef(0);
  const lastDistanceMetersRef = useRef(0);
  const lastStepDistanceRef = useRef("");
  const [progress, setProgress] = useState<ProgressIndex>({
    segmentIndex: 0,
    pointIndex: 0,
  });

  // Stop tracking after markers have rendered
  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Re-enable tracking when mode changes so the marker re-renders
  useEffect(() => {
    setTracksViewChanges(true);
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, [navigationMode]);

  const fullRouteSegments = useMemo(() => {
    if (!allOutdoorRoutes?.length) return [];

    const apiMode = TRANSPORT_MODE_API_MAP[navigationMode];
    const route = allOutdoorRoutes.find(
      (r) => r.transportMode?.toLowerCase() === apiMode?.toLowerCase(),
    );

    if (!route) return [];

    // Prefer step-level polylines for segmented styling by parsing instructions
    if (route.steps?.length) {
      return route.steps.map((step) => ({
        coordinates: decodeToCoords(step.polyline),
        style: inferStyleFromInstruction(step.instruction, navigationMode),
      }));
    }

    if (route.polyline) {
      // Fallback to overview polyline with a single style
      const mode = navigationMode.toUpperCase();
      const style = POLYLINE_STYLES[mode] || POLYLINE_STYLES.WALK;
      return [
        {
          coordinates: decodeToCoords(route.polyline),
          style: style,
        },
      ];
    }

    return [];
  }, [allOutdoorRoutes, navigationMode]);

  useEffect(() => {
    progressRef.current = { segmentIndex: 0, pointIndex: 0 };
    lastStepIndexRef.current = 0;
    lastDistanceUpdateRef.current = 0;
    lastDistanceMetersRef.current = 0;
    lastStepDistanceRef.current = "";
    setProgress({ segmentIndex: 0, pointIndex: 0 });
    resetProgress();
  }, [fullRouteSegments, resetProgress]);

  // Update progress based on user location (forward-only, windowed search)
  useEffect(() => {
    if (!isNavigating || !currentLocation || !fullRouteSegments.length) return;

    const allCoords = flattenSegments(fullRouteSegments);
    if (!allCoords.length) return;

    const currentFlatIdx = toFlatIndex(fullRouteSegments, progressRef.current);
    const result = findClosestInWindow(
      currentLocation,
      allCoords,
      currentFlatIdx,
      SEARCH_WINDOW_POINTS,
    );

    if (!result) return;

    const isOnRoute = result.distance <= ON_ROUTE_THRESHOLD_METERS;
    const isMovingForward = result.flatIndex > currentFlatIdx;
    const isAtStart = currentFlatIdx === 0 && result.flatIndex >= 0;

    // Advance polyline progress only when moving forward on the route
    if (isOnRoute && (isMovingForward || isAtStart)) {
      const newProgress = fromFlatIndex(fullRouteSegments, result.flatIndex);

      if (
        newProgress.segmentIndex !== progressRef.current.segmentIndex ||
        newProgress.pointIndex !== progressRef.current.pointIndex
      ) {
        progressRef.current = newProgress;
        setProgress(newProgress);

        if (newProgress.segmentIndex !== lastStepIndexRef.current) {
          lastStepIndexRef.current = newProgress.segmentIndex;
          setCurrentStepIndex(newProgress.segmentIndex);
        }

        const currentSegCoords =
          fullRouteSegments[newProgress.segmentIndex].coordinates;
        const remainingSegCoords = currentSegCoords.slice(
          newProgress.pointIndex,
        );
        const remainingSegMeters = sumPolylineDistance(remainingSegCoords);
        const stepDistStr = formatDistance(remainingSegMeters);
        if (stepDistStr !== lastStepDistanceRef.current) {
          lastStepDistanceRef.current = stepDistStr;
          setDistanceToNextStep(stepDistStr);
        }
      }
    }

    // Always update total remaining distance + ETA (throttled, independent of progress)
    const bestIdx = Math.max(result.flatIndex, currentFlatIdx);
    const remainingPolyline = sumPolylineDistance(allCoords.slice(bestIdx));
    const destCoord = allCoords[allCoords.length - 1];
    const directToDest = haversineDistance(currentLocation, destCoord);
    const remainingMeters = Math.min(remainingPolyline, directToDest);

    const now = Date.now();
    const timeSinceLast = now - lastDistanceUpdateRef.current;
    const delta = Math.abs(remainingMeters - lastDistanceMetersRef.current);

    const THROTTLE_MS = 3000;
    const MIN_DELTA_METERS = 5;

    if (timeSinceLast >= THROTTLE_MS || delta >= MIN_DELTA_METERS) {
      lastDistanceUpdateRef.current = now;
      lastDistanceMetersRef.current = remainingMeters;
      setPathDistance(formatDistance(remainingMeters));

      const speed = currentSpeed > 0.5 ? currentSpeed : 1.4;
      const remainingSeconds = remainingMeters / speed;
      const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));
      if (remainingMinutes >= 60) {
        const hours = Math.floor(remainingMinutes / 60);
        const mins = remainingMinutes % 60;
        setPathDuration(`${hours} hour${hours > 1 ? "s" : ""} ${mins} mins`);
      } else {
        setPathDuration(`${remainingMinutes} mins`);
      }
    }
  }, [
    currentLocation,
    isNavigating,
    fullRouteSegments,
    setCurrentStepIndex,
    setDistanceToNextStep,
    setPathDistance,
    setPathDuration,
    currentSpeed,
  ]);

  const routeSegments = useMemo(() => {
    if (!isNavigating) {
      return fullRouteSegments;
    }
    return trimSegmentsFromProgress(fullRouteSegments, progress);
  }, [fullRouteSegments, isNavigating, progress]);

  // Create a unique key suffix based on current progress to force re-render
  const progressKey = isNavigating
    ? `${progress.segmentIndex}-${progress.pointIndex}`
    : "full";

  return (
    <>
      {routeSegments.map((segment, index) => (
        <Polyline
          key={`${navigationMode}-${progressKey}-segment-${index}`}
          coordinates={segment.coordinates}
          strokeWidth={3}
          strokeColor={segment.style.color}
          lineDashPattern={segment.style.dash}
        />
      ))}
      {destination && (
        <Marker
          coordinate={destination}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={tracksViewChanges}
          zIndex={10}
        >
          <EndPin />
        </Marker>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  endPin: {
    width: 28,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
