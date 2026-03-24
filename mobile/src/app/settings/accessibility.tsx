import React, { useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Switch } from "react-native";
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

  return (
    <SettingsScreenScaffold
      title="Accessibility Settings"
      backLabelStyle={textStyle(17)}
      titleStyle={[textStyle(28), { marginBottom: 20 }]}
    >
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text
              style={[styles.cardTitle, textStyle(16), { color: colors.text }]}
            >
              I use a wheelchair
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                textStyle(13),
                { color: colors.textMuted },
              ]}
            >
              Prioritize accessible routes and elevator or ramp options
            </Text>
          </View>
          <Switch
            value={wheelchairUser}
            onValueChange={toggleWheelchairUser}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text
              style={[styles.cardTitle, textStyle(16), { color: colors.text }]}
            >
              Color Blind Mode
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                textStyle(13),
                { color: colors.textMuted },
              ]}
            >
              Adjust colors for better visibility
            </Text>
          </View>
          <Switch
            value={colorBlindMode}
            onValueChange={toggleColorBlindMode}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text
              style={[styles.cardTitle, textStyle(16), { color: colors.text }]}
            >
              Font Size
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                textStyle(13),
                { color: colors.textMuted },
              ]}
            >
              Make text larger throughout the app
            </Text>
          </View>
          <Text
            style={[
              styles.valueLabel,
              textStyle(14),
              { color: colors.primary },
            ]}
          >
            {getFontSizeLabel(fontSize)}
          </Text>
        </View>
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
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text
              style={[styles.cardTitle, textStyle(16), { color: colors.text }]}
            >
              Text Weight
            </Text>
            <Text
              style={[
                styles.cardSubtitle,
                textStyle(13),
                { color: colors.textMuted },
              ]}
            >
              Adjust how bold text appears
            </Text>
          </View>
          <Text
            style={[
              styles.valueLabel,
              textStyle(14),
              { color: colors.primary },
            ]}
          >
            {getFontWeightLabel(fontWeight)}
          </Text>
        </View>
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
      </View>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  valueLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
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
