import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { IndoorDirectionResponse } from "../types/indoorDirections";
import { TransportMode, TRANSPORT_MODE_API_MAP } from "../type";
import { OutdoorDirectionResponse } from "../api/outdoorDirectionsApi";
import NavigationTransportCard from "./navigation-config/NavigationTransportCard";

const TRANSPORT_MODES: TransportMode[] = [
  "WALK",
  "BIKE",
  "BUS",
  "CAR",
  "SHUTTLE",
];

interface BottomPanelProps {
  startRoom: string;
  endRoom: string;
  routeData: IndoorDirectionResponse | null;
  isLoadingRoute: boolean;
  showDirections: boolean;
  onToggleDirections: () => void;
  selectedTransportMode: TransportMode;
  onTransportModeChange: (mode: TransportMode) => void;
  outdoorRoutes: OutdoorDirectionResponse[];
  nextShuttleTime: string | null;
}

function getSuggestionText(startRoom: string, endRoom: string): string {
  if (startRoom && endRoom) return "Finding route...";
  if (startRoom) return "Select a destination";
  if (endRoom) return "Select a starting point";
  return "Select a starting point and destination above";
}

export default function BottomPanel({
  startRoom,
  endRoom,
  routeData,
  isLoadingRoute,
  showDirections,
  onToggleDirections,
  selectedTransportMode,
  onTransportModeChange,
  outdoorRoutes,
  nextShuttleTime,
}: Readonly<BottomPanelProps>) {
  const getDurationForMode = (mode: TransportMode): string => {
    if (mode === "SHUTTLE") return "N/A";
    const apiMode = TRANSPORT_MODE_API_MAP[mode];
    return (
      outdoorRoutes.find((r) => r.transportMode === apiMode)?.duration ?? ""
    );
  };

  const showTransportModes = outdoorRoutes.length > 0 || !!nextShuttleTime;

  return (
    <View style={styles.bottomPanel}>
      {!routeData || isLoadingRoute ? (
        /* Suggestion Panel - When no route is shown */
        <View style={styles.suggestionPanel}>
          <Text style={styles.suggestionSubtitle}>
            {getSuggestionText(startRoom, endRoom)}
          </Text>
        </View>
      ) : (
        /* Route Summary Panel - When route is available */
        <View style={styles.routeSummaryPanel}>
          <View style={[styles.routeInfoRow, styles.horizontalPad]}>
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoLabel}>From</Text>
              <Text style={styles.routeInfoValue} numberOfLines={1}>
                {startRoom || "—"}
              </Text>
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeInfoLabel}>To</Text>
              <Text style={styles.routeInfoValue} numberOfLines={1}>
                {endRoom || "—"}
              </Text>
            </View>
          </View>

          {showTransportModes && (
            <View style={styles.transportRow}>
              {TRANSPORT_MODES.map((mode) => (
                <NavigationTransportCard
                  key={mode}
                  mode={mode}
                  duration={getDurationForMode(mode)}
                  isSelected={selectedTransportMode === mode}
                  onSelect={() => onTransportModeChange(mode)}
                />
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.goButton, styles.horizontalPad]}
            onPress={onToggleDirections}
          >
            <Text style={styles.goButtonText}>
              {showDirections ? "Hide" : "Show"} Directions
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomPanel: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 80 : 60,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  suggestionPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
    alignItems: "center",
  },
  suggestionSubtitle: {
    fontSize: 14,
    color: "#757575",
  },
  transportRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#D9D9D9",
    borderRadius: 8,
    marginBottom: 10,
  },
  horizontalPad: {
    paddingHorizontal: 16,
  },
  routeSummaryPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 6,
  },
  routeInfoRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  routeInfo: {
    alignItems: "center",
  },
  routeInfoLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  routeInfoValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121",
    maxWidth: 140,
  },
  goButton: {
    backgroundColor: "#8B1538",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  goButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
