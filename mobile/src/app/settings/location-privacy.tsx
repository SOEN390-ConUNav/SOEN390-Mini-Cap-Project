import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsCard,
  SettingsIconCircle,
  SettingsLinkRow,
  SettingsSectionLabel,
  SettingsSwitchRow,
} from "../../components/settings";
import { useSettingsSwitchTrackColor } from "../../components/settings/useSettingsSwitchColors";

export default function SettingsLocationPrivacy() {
  const router = useRouter();
  const { colors } = useTheme();
  const trackColor = useSettingsSwitchTrackColor();

  const [locationEnabled, setLocationEnabled] = useState(true);
  const [backgroundLocation, setBackgroundLocation] = useState(false);

  return (
    <SettingsScreenScaffold
      title="Location & Privacy"
      titleStyle={styles.titleSpacing}
    >
      <SettingsCard marginBottom={14}>
        <View style={styles.cardHeaderRow}>
          <SettingsIconCircle name="location-outline" />
          <View style={styles.flex1}>
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
            trackColor={trackColor}
          />
        </View>
        <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
          Allow the app to access your location to provide accurate navigation
          and directions.
        </Text>
      </SettingsCard>

      <SettingsLinkRow
        title="Location Permission Tutorial"
        subtitle="How to enable location access"
        onPress={() => router.push("/settings/location-permission-tutorial")}
        style={{ marginBottom: 18 }}
      />

      <SettingsSectionLabel>Privacy Settings</SettingsSectionLabel>

      <SettingsCard marginBottom={14}>
        <SettingsSwitchRow
          title="Background Location Access"
          subtitle="Allow location access even when the app is in the background."
          value={backgroundLocation}
          onValueChange={setBackgroundLocation}
          titleStyle={styles.backgroundRowTitle}
        />
      </SettingsCard>

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
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  flex1: {
    flex: 1,
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
  backgroundRowTitle: {
    fontSize: 16,
    fontWeight: "600",
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
