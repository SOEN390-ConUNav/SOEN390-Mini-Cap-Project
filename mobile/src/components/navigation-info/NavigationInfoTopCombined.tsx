import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import useNavigationInfo from "../../hooks/useNavigationInfo";
import { calculateETA } from "../../utils/navigationUtils";
import { Step } from "../../api/outdoorDirectionsApi";
import {
  getManeuverIcon,
  getStreetOnlyInstruction,
} from "../navigation-direction/navigationDirectionUtils";

interface NavigationInfoTopCombinedProps {
  readonly destination: string;
  readonly showInfoExtended: boolean;
  readonly showHudExtended: boolean;
  readonly hudStep?: Step;
}

export default function NavigationInfoTopCombined({
  destination,
  showInfoExtended,
  showHudExtended,
  hudStep,
}: NavigationInfoTopCombinedProps) {
  const distance = useNavigationInfo((state) => state.pathDistance);
  const duration = useNavigationInfo((state) => state.pathDuration);
  const street = getStreetOnlyInstruction(hudStep?.instruction);
  const showHud = showHudExtended && Boolean(hudStep && street);

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <MaterialIcons name="place" size={18} color="#000" />
          <Text style={styles.title} numberOfLines={1}>
            {destination}
          </Text>
        </View>

        {showInfoExtended && (
          <>
            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Arriving at</Text>
              <Text style={styles.value}>{calculateETA(duration)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Distance</Text>
              <Text style={styles.value}>{distance}</Text>
            </View>
          </>
        )}
      </View>

      {showHud && (
        <View style={styles.hudSection}>
          <Ionicons
            name={getManeuverIcon(hudStep!.maneuverType)}
            size={16}
            color="#ffffff"
          />
          <Text style={styles.hudText} numberOfLines={1}>
            {street}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#800020",
    elevation: 4,
    overflow: "hidden",
  },
  topSection: {
    padding: 14,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    marginLeft: 6,
    fontWeight: "bold",
    fontSize: 16,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  label: {
    color: "#555",
    fontSize: 14,
  },
  value: {
    fontWeight: "bold",
    fontSize: 14,
  },
  hudSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#800020",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  hudText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
  },
});
