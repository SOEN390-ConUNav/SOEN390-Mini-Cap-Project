import React, { useEffect } from "react";
import { StyleSheet, Text, View, Switch } from "react-native";
import Slider from "@react-native-community/slider";
import {
  useDisplaySettings,
  getBrightnessLabel,
} from "../../hooks/useDisplaySettings";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";

export default function SettingsDisplay() {
  const { isDark, colors } = useTheme();
  const {
    brightness,
    autoBrightness,
    darkMode,
    colorIntensity,
    setBrightness,
    setAutoBrightness,
    setDarkMode,
    setColorIntensity,
    hydrateFromStorage,
  } = useDisplaySettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const colorIntensityLabel = `${colorIntensity}%`;
  const trackInactive = isDark ? "#444" : "#eee";

  return (
    <SettingsScreenScaffold title="Display & Brightness">
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Brightness
          </Text>
          <Text style={[styles.emphasisLabel, { color: colors.primary }]}>
            {getBrightnessLabel(brightness)}
          </Text>
        </View>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
          Adjust screen brightness level.
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={trackInactive}
          thumbTintColor={colors.text}
          value={brightness}
          onValueChange={setBrightness}
        />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Auto-Brightness
          </Text>
          <Switch
            value={autoBrightness}
            onValueChange={setAutoBrightness}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
          Adjust brightness based on ambient light.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          Appearance
        </Text>

        <View style={[styles.rowHeader, { marginTop: 10 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Dark Mode
            </Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              Switch to a darker color scheme.
            </Text>
          </View>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Color Intensity
          </Text>
          <Text style={[styles.emphasisLabel, { color: colors.primary }]}>
            {colorIntensityLabel}
          </Text>
        </View>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
          Adjust vibrancy of colors throughout the app.
        </Text>
        <Slider
          style={styles.slider}
          minimumValue={50}
          maximumValue={150}
          step={1}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={trackInactive}
          thumbTintColor={colors.text}
          value={colorIntensity}
          onValueChange={setColorIntensity}
        />
      </View>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  rowHeader: {
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
    marginTop: 4,
    marginBottom: 8,
  },
  emphasisLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  slider: {
    marginTop: 4,
  },
});
