import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import { Coordinate, TRANSPORT_MODE_API_MAP } from "../type";
import useNavigationConfig from "../hooks/useNavigationConfig";

const BURGUNDY = "#800020";
const POLYLINE_STYLES: Record<string, { color: string; dash?: number[] }> = {
  WALK: { color: BURGUNDY, dash: [2, 5] }, // Dotted Red
  SHUTTLE: { color: BURGUNDY }, // Solid Red
  BUS: { color: "#0085CA" }, // Solid Blue
  BIKE: { color: "#228B22", dash: [10, 5] }, // Dashed Green
  CAR: { color: "#808080" }, // Solid Gray
};

export const inferStyleFromInstruction = (
  instruction: string,
  defaultMode: string,
) => {
  const mode = defaultMode.toUpperCase();

  // For walk, bike, car — skip instruction parsing, use mode directly
  if (mode === "WALK" || mode === "WALKING") return POLYLINE_STYLES.WALK;
  if (mode === "BIKE" || mode === "BICYCLING") return POLYLINE_STYLES.BIKE;
  if (mode === "CAR" || mode === "DRIVING") return POLYLINE_STYLES.CAR;

  const text = instruction.toLowerCase();

  // If instruction mentions walking, use walk style
  if (text.includes("walk") || text.includes("head ")) {
    return POLYLINE_STYLES.WALK;
  }

  // If instruction mentions shuttle
  if (text.includes("shuttle")) {
    return POLYLINE_STYLES.SHUTTLE;
  }

  // If instruction mentions transit/bus/train
  if (
    text.includes("bus") ||
    text.includes("train") ||
    text.includes("take ") ||
    text.includes("metro")
  ) {
    return POLYLINE_STYLES.BUS;
  }

  // Fallback to the overall route mode style
  if (mode === "SHUTTLE") return POLYLINE_STYLES.SHUTTLE;
  if (mode === "BUS" || mode === "TRANSIT") return POLYLINE_STYLES.BUS;

  return POLYLINE_STYLES.WALK;
};

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

export default function DirectionPath({ destination }: DirectionPathProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const { navigationMode, allOutdoorRoutes } = useNavigationConfig();

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

  const routeSegments = useMemo(() => {
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

  return (
    <>
      {routeSegments.map((segment, index) => (
        <Polyline
          key={`${navigationMode}-segment-${index}`}
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
