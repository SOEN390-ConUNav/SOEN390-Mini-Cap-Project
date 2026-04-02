import React, { useEffect } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import {
  useAccessibilitySettings,
  getFontSizeLabel,
  getFontWeightLabel,
  useAccessibleTypography,
  FONT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
} from "../../hooks/useAccessibilitySettings";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsCard,
  SettingsLabeledValueRow,
  SettingsSwitchRow,
} from "../../components/settings";

export default function SettingsAccessibility() {
  const { colors } = useTheme();
  const {
    colorBlindMode,
    wheelchairUser,
    fontSize,
    fontWeight,
    toggleColorBlindMode,
    toggleWheelchairUser,
    setFontSize,
    setFontWeight,
    hydrateFromStorage,
  } = useAccessibilitySettings();

  const { textStyle } = useAccessibleTypography();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const titleStyle = textStyle(16);
  const subtitleStyle = textStyle(13);

  return (
    <SettingsScreenScaffold
      title="Accessibility Settings"
      backLabelStyle={textStyle(17)}
      titleStyle={[textStyle(28), { marginBottom: 20 }]}
    >
      <SettingsCard marginBottom={14}>
        <SettingsSwitchRow
          title="I use a wheelchair"
          subtitle="Prioritize accessible routes and elevator or ramp options"
          value={wheelchairUser}
          onValueChange={toggleWheelchairUser}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
        />
      </SettingsCard>

      <SettingsCard marginBottom={14}>
        <SettingsSwitchRow
          title="Color Blind Mode"
          subtitle="Adjust colors for better visibility"
          value={colorBlindMode}
          onValueChange={toggleColorBlindMode}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
        />
      </SettingsCard>

      <SettingsCard marginBottom={14}>
        <SettingsLabeledValueRow
          title="Font Size"
          subtitle="Make text larger throughout the app"
          valueLabel={getFontSizeLabel(fontSize)}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
          valueStyle={textStyle(14)}
        />
        <View style={styles.sliderRow}>
          {FONT_SIZE_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.sliderDot,
                { backgroundColor: colors.border },
                fontSize === option && [
                  styles.sliderDotActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setFontSize(option)}
            />
          ))}
        </View>
        <Text
          style={[styles.previewText, textStyle(16), { color: colors.primary }]}
        >
          This is how text will look
        </Text>
      </SettingsCard>

      <SettingsCard marginBottom={14}>
        <SettingsLabeledValueRow
          title="Text Weight"
          subtitle="Adjust how bold text appears"
          valueLabel={getFontWeightLabel(fontWeight)}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
          valueStyle={textStyle(14)}
        />
        <View style={styles.sliderRow}>
          {FONT_WEIGHT_OPTIONS.map((option) => (
            <Pressable
              key={option}
              style={[
                styles.sliderDot,
                { backgroundColor: colors.border },
                fontWeight === option && [
                  styles.sliderDotActive,
                  { backgroundColor: colors.primary },
                ],
              ]}
              onPress={() => setFontWeight(option)}
            />
          ))}
        </View>
        <Text
          style={[styles.previewText, textStyle(15), { color: colors.primary }]}
        >
          Bold preview text
        </Text>
      </SettingsCard>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  sliderDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  sliderDotActive: {},
  previewText: {
    marginTop: 8,
    fontSize: 14,
  },
});
