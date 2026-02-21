import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Polyline, Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import polyline from "@mapbox/polyline";
import { Coordinate, TRANSPORT_MODE_API_MAP } from "../type";
import useNavigationConfig from "../hooks/useNavigationConfig";

const BURGUNDY = "#800020";

interface DirectionPathProps {
  readonly origin?: Coordinate | null;
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

  const routeCoords = useMemo(() => {
    if (!allOutdoorRoutes?.length) return [];

    const apiMode = TRANSPORT_MODE_API_MAP[navigationMode];
    const route = allOutdoorRoutes.find(
      (r) => r.transportMode?.toLowerCase() === apiMode?.toLowerCase(),
    );

    if (!route) return [];

    // Prefer step-level polylines for accuracy, fall back to overview
    if (route.steps?.length) {
      return route.steps.flatMap((step) => decodeToCoords(step.polyline));
    }

    return route.polyline ? decodeToCoords(route.polyline) : [];
  }, [allOutdoorRoutes, navigationMode]);

  return (
    <>
      <Polyline
        coordinates={routeCoords}
        strokeWidth={3}
        strokeColor={BURGUNDY}
        lineDashPattern={navigationMode === "WALK" ? [5, 5] : undefined}
      />
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
