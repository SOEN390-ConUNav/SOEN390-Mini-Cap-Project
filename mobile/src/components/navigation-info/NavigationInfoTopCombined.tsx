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
import { useTheme } from "../../hooks/useTheme";

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
  const { colors } = useTheme();
  const distance = useNavigationInfo((state) => state.pathDistance);
  const duration = useNavigationInfo((state) => state.pathDuration);
  const street = getStreetOnlyInstruction(hudStep?.instruction);
  const showHud = showHudExtended && Boolean(hudStep && street);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={[styles.topSection, { backgroundColor: colors.card }]}>
        <View style={styles.headerRow}>
          <MaterialIcons name="place" size={18} color={colors.text} />
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {destination}
          </Text>
        </View>

        {showInfoExtended && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Arriving at</Text>
              <Text style={[styles.value, { color: colors.text }]}>{calculateETA(duration)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Distance</Text>
              <Text style={[styles.value, { color: colors.text }]}>{distance}</Text>
            </View>
          </>
        )}
      </View>

      {showHud && (
        <View style={[styles.hudSection, { backgroundColor: colors.primary }]}>
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
    borderRadius: 18,
    borderWidth: 1,
    elevation: 4,
    overflow: "hidden",
  },
  topSection: {
    padding: 14,
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
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  label: {
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
