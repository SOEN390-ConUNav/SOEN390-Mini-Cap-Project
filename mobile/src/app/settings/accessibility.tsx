import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useAccessibilitySettings,
  getFontSizeLabel,
  getFontWeightLabel,
  getFontScale,
  getFontWeightValue,
} from "../../hooks/useAccessibilitySettings";
import { useTheme } from "../../hooks/useTheme";

export default function SettingsAccessibility() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    colorBlindMode,
    highContrastMode,
    reduceMotion,
    wheelchairUser,
    fontSize,
    fontWeight,
    toggleColorBlindMode,
    toggleHighContrastMode,
    toggleReduceMotion,
    toggleWheelchairUser,
    setFontSize,
    setFontWeight,
    hydrateFromStorage,
  } = useAccessibilitySettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const fontScale = getFontScale(fontSize);
  const previewWeight = getFontWeightValue(fontWeight) as "400" | "500" | "700";
  const font = (baseSize: number) => ({
    fontSize: Math.round(baseSize * fontScale),
    fontWeight: previewWeight,
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={[styles.backLabel, font(17), { color: colors.primary }]}>Settings</Text>
      </Pressable>
      <Text style={[styles.title, font(28), { color: colors.text }]}>Accessibility Settings</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, font(16), { color: colors.text }]}>I use a wheelchair</Text>
            <Text style={[styles.cardSubtitle, font(13), { color: colors.textMuted }]}>
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
            <Text style={[styles.cardTitle, font(16), { color: colors.text }]}>Color Blind Mode</Text>
            <Text style={[styles.cardSubtitle, font(13), { color: colors.textMuted }]}>
              Adjust colors for better visibility
            </Text>
          </View>
          <Switch value={colorBlindMode} onValueChange={toggleColorBlindMode} trackColor={{ false: colors.border, true: colors.primary }} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, font(16), { color: colors.text }]}>Font Size</Text>
            <Text style={[styles.cardSubtitle, font(13), { color: colors.textMuted }]}>
              Make text larger throughout the app
            </Text>
          </View>
          <Text style={[styles.valueLabel, font(14), { color: colors.primary }]}>{getFontSizeLabel(fontSize)}</Text>
        </View>
        <View style={styles.sliderRow}>
          {(["small", "medium", "large"] as const).map((option) => (
            <Pressable
              key={option}
              style={[
                styles.sliderDot,
                { backgroundColor: colors.border },
                fontSize === option && [styles.sliderDotActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setFontSize(option)}
            />
          ))}
        </View>
        <Text style={[styles.previewText, font(16), { color: colors.primary }]}>
          This is how text will look
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, font(16), { color: colors.text }]}>Text Weight</Text>
            <Text style={[styles.cardSubtitle, font(13), { color: colors.textMuted }]}>
              Adjust how bold text appears
            </Text>
          </View>
          <Text style={[styles.valueLabel, font(14), { color: colors.primary }]}>{getFontWeightLabel(fontWeight)}</Text>
        </View>
        <View style={styles.sliderRow}>
          {(["light", "regular", "bold"] as const).map((option) => (
            <Pressable
              key={option}
              style={[
                styles.sliderDot,
                { backgroundColor: colors.border },
                fontWeight === option && [styles.sliderDotActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setFontWeight(option)}
            />
          ))}
        </View>
        <Text style={[styles.previewText, font(15), { color: colors.primary }]}>
          Bold preview text
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, font(16), { color: colors.text }]}>High Contrast Mode</Text>
            <Text style={[styles.cardSubtitle, font(13), { color: colors.textMuted }]}>
              Enhance contrast between elements
            </Text>
          </View>
          <Switch
            value={highContrastMode}
            onValueChange={toggleHighContrastMode}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={[styles.cardTitle, font(16), { color: colors.text }]}>Reduce Motion</Text>
            <Text style={[styles.cardSubtitle, font(13), { color: colors.textMuted }]}>
              Minimize animations and transitions
            </Text>
          </View>
          <Switch
            value={reduceMotion}
            onValueChange={toggleReduceMotion}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backLabel: { fontSize: 17, marginLeft: 4 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
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

