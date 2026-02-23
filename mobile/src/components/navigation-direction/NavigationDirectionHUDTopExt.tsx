import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Step } from "../../api/outdoorDirectionsApi";
import {
  getManeuverIcon,
  getStreetOnlyInstruction,
} from "./navigationDirectionUtils";

interface NavigationDirectionHUDTopExtProps {
  readonly step?: Step;
}

export default function NavigationDirectionHUDTopExt({
  step,
}: NavigationDirectionHUDTopExtProps) {
  const street = getStreetOnlyInstruction(step?.instruction);
  if (!step || !street) return null;

  return (
    <View style={styles.container}>
      <Ionicons
        name={getManeuverIcon(step.maneuverType)}
        size={16}
        color="#ffffff"
      />
      <Text style={styles.text} numberOfLines={1}>
        {street}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#800020",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
  },
});
