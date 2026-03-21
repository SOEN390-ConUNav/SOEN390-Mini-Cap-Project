import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";

export default function SettingsLocationPrivacy() {
  const router = useRouter();
  const { colors } = useTheme();

  const [locationEnabled, setLocationEnabled] = useState(true);
  const [backgroundLocation, setBackgroundLocation] = useState(false);

  return (
    <SettingsScreenScaffold
      title="Location & Privacy"
      titleStyle={styles.titleSpacing}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeaderRow}>
          <View
            style={[styles.iconCircle, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="location-outline" size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Location Services
            </Text>
            <Text style={[styles.cardStatus, { color: colors.primary }]}>
              {locationEnabled ? "On" : "Off"}
            </Text>
          </View>
          <Switch
            value={locationEnabled}
            onValueChange={setLocationEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
          Allow the app to access your location to provide accurate navigation
          and directions.
        </Text>
      </View>

      <Pressable
        style={[styles.rowCard, { backgroundColor: colors.card }]}
        onPress={() => router.push("/settings/location-permission-tutorial")}
      >
        <View>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Location Permission Tutorial
          </Text>
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
            How to enable location access
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        Privacy Settings
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Background Location Access
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              Allow location access even when the app is in the background.
            </Text>
          </View>
          <Switch
            value={backgroundLocation}
            onValueChange={setBackgroundLocation}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <Pressable
        style={styles.privacyLinkRow}
        onPress={() => router.push("/settings/privacy-policy")}
      >
        <Text style={[styles.privacyLinkText, { color: colors.primary }]}>
          View Privacy Policy
        </Text>
        <Ionicons name="open-outline" size={18} color={colors.primary} />
      </Pressable>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  titleSpacing: {
    marginBottom: 18,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  cardStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  rowCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  privacyLinkRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  privacyLinkText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
