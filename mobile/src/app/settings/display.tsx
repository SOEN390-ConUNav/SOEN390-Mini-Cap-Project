import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Switch,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import {
  useDisplaySettings,
  getBrightnessLabel,
} from "../../hooks/useDisplaySettings";
import { useTheme } from "../../hooks/useTheme";

export default function SettingsDisplay() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const {
    brightness,
    autoBrightness,
    darkMode,
    colorIntensity,
    screenTimeout,
    displayZoom,
    setBrightness,
    setAutoBrightness,
    setDarkMode,
    setColorIntensity,
    setScreenTimeout,
    setDisplayZoom,
    hydrateFromStorage,
  } = useDisplaySettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const colorIntensityLabel = `${colorIntensity}%`;
  const trackInactive = isDark ? "#444" : "#eee";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={[styles.backLabel, { color: colors.primary }]}>Settings</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>Display & Brightness</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.rowHeader}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Brightness</Text>
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
            <Text style={[styles.rowTitle, { color: colors.text }]}>Auto-Brightness</Text>
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
          <Text style={[styles.rowTitle, { color: colors.text }]}>Appearance</Text>

          <View style={[styles.rowHeader, { marginTop: 10 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Dark Mode</Text>
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
            <Text style={[styles.rowTitle, { color: colors.text }]}>Color Intensity</Text>
            <Text style={[styles.emphasisLabel, { color: colors.primary }]}>{colorIntensityLabel}</Text>
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

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Display Settings</Text>

          <Pressable
            style={styles.inlineRow}
            onPress={() => {
              const next =
                screenTimeout === "30s"
                  ? "1m"
                  : screenTimeout === "1m"
                  ? "2m"
                  : "30s";
              setScreenTimeout(next);
            }}
          >
            <Text style={[styles.inlineLabel, { color: colors.text }]}>Screen Timeout</Text>
            <Text style={[styles.inlineValue, { color: colors.primary }]}>
              {screenTimeout === "30s"
                ? "30 seconds"
                : screenTimeout === "1m"
                ? "1 minute"
                : "2 minutes"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.inlineRow}
            onPress={() => {
              setDisplayZoom(displayZoom === "Standard" ? "Large" : "Standard");
            }}
          >
            <Text style={[styles.inlineLabel, { color: colors.text }]}>Display Zoom</Text>
            <Text style={[styles.inlineValue, { color: colors.primary }]}>{displayZoom}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backLabel: { fontSize: 17, marginLeft: 4 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  inlineLabel: {
    fontSize: 14,
  },
  inlineValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});

