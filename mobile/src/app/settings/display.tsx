import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Slider from "@react-native-community/slider";
import {
  useDisplaySettings,
  getBrightnessLabel,
} from "../../hooks/useDisplaySettings";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsCard,
  SettingsRowHeader,
  SettingsSwitchRow,
} from "../../components/settings";

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
      <SettingsCard>
        <SettingsRowHeader
          title="Brightness"
          valueLabel={getBrightnessLabel(brightness)}
        />
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
      </SettingsCard>

      <SettingsCard>
        <SettingsSwitchRow
          title="Auto-Brightness"
          subtitle="Adjust brightness based on ambient light."
          value={autoBrightness}
          onValueChange={setAutoBrightness}
          subtitleBelow
        />
      </SettingsCard>

      <SettingsCard>
        <Text style={[styles.rowTitle, { color: colors.text }]}>
          Appearance
        </Text>
        <View style={{ marginTop: 10 }}>
          <SettingsSwitchRow
            title="Dark Mode"
            subtitle="Switch to a darker color scheme."
            value={darkMode}
            onValueChange={setDarkMode}
          />
        </View>
      </SettingsCard>

      <SettingsCard>
        <SettingsRowHeader
          title="Color Intensity"
          valueLabel={colorIntensityLabel}
        />
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
      </SettingsCard>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  slider: {
    marginTop: 4,
  },
});
