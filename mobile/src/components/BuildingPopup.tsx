import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Foundation from "@expo/vector-icons/Foundation";
import { BuildingId } from "../data/buildings";
import { hasIndoorMaps } from "../utils/buildingIndoorMaps";
import { useTheme } from "../hooks/useTheme";
import {
  useAccessibilitySettings,
  getFontScale,
  getFontWeightValue,
} from "../hooks/useAccessibilitySettings";

const defaultAccessibility = {
  hasElevator: false,
  hasParking: false,
  isAccessible: false,
};

export default function BuildingPopup({
  id,
  name,
  addressLines = [],
  buildingId,
  openingHours = "",
  hasStudySpots = false,
  image,
  accessibility,
  onClose,
  onDirections,
  onIndoorMaps,
}: {
  id: string;
  name: string;
  addressLines?: string[];
  buildingId: BuildingId;
  openingHours?: string;
  hasStudySpots?: boolean;
  image: any;
  accessibility?: {
    hasElevator: boolean;
    hasParking: boolean;
    isAccessible: boolean;
  };
  onClose: () => void;
  onDirections: () => void;
  onIndoorMaps?: () => void;
}) {
  const { colors } = useTheme();
  const { fontSize, fontWeight } = useAccessibilitySettings();
  const fontScale = getFontScale(fontSize);
  const weightValue = getFontWeightValue(fontWeight);
  const showIndoorMaps = hasIndoorMaps(buildingId);
  const acc = accessibility ?? defaultAccessibility;

  const font = (base: number) => ({
    fontSize: Math.round(base * fontScale),
    fontWeight: weightValue as "400" | "500" | "700",
  });

  return (
    <View style={styles.backdrop}>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {image != null && <Image source={image} style={styles.image} resizeMode="cover" />}

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, font(18), { color: colors.text }]}>{name}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.iconsRow}>
              {acc.hasParking && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>P</Text>
                </View>
              )}

              {acc.hasElevator && (
                <Foundation name="elevator" size={20} color={colors.primary} />
              )}

              {acc.isAccessible && (
                <FontAwesome name="wheelchair" size={20} color={colors.primary} />
              )}
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {(addressLines ?? []).map((line, idx) => (
          <Text key={idx} style={[styles.address, font(14), { color: colors.textMuted }]}>
            {line}
          </Text>
        ))}

        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, font(14), { color: colors.text }]}>Hours:</Text>
          <Text style={[styles.metaValue, font(14), { color: colors.textMuted }]}>{openingHours}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.metaLabel, font(14), { color: colors.text }]}>Study Spots:</Text>
          <Text style={[styles.metaValue, font(14), { color: colors.textMuted }]}>{hasStudySpots ? "Yes" : "No"}</Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable onPress={onDirections} style={[styles.directionsBtn, { backgroundColor: colors.primary }]}>
            <FontAwesome5 name="directions" size={18} color="white" />
            <Text style={[styles.directionsText, font(14)]}>Directions</Text>
          </Pressable>

          {showIndoorMaps && onIndoorMaps && (
            <Pressable onPress={onIndoorMaps} style={[styles.indoorMapsBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="map" size={18} color="white" />
              <Text style={[styles.indoorMapsText, font(14)]}>Indoor Maps</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  image: {
    width: "100%",
    height: 120,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  title: {},
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontWeight: "900" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  address: {
    marginTop: 4,
    paddingHorizontal: 14,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    marginTop: 8,
  },
  metaLabel: {},
  metaValue: {},
  buttonRow: {
    marginTop: 14,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 14,
  },
  directionsText: { color: "#fff" },
  indoorMapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  indoorMapsText: { color: "#fff" },
});
