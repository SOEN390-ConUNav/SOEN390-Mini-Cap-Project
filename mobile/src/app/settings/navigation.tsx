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
  useNavigationSettings,
  getVoiceVolumeLabel,
} from "../../hooks/useNavigationSettings";
import { useTheme } from "../../hooks/useTheme";

export default function SettingsNavigation() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    voiceGuidance,
    voiceVolume,
    avoidStairs,
    indoorNavigation,
    autoRerouting,
    showCompass,
    showPedestrianTraffic,
    mapTiltAngle,
    distanceUnits,
    mapStyle,
    northOrientation,
    setVoiceGuidance,
    setVoiceVolume,
    setAvoidStairs,
    setIndoorNavigation,
    setAutoRerouting,
    setShowCompass,
    setShowPedestrianTraffic,
    setMapTiltAngle,
    setDistanceUnits,
    setMapStyle,
    setNorthOrientation,
    hydrateFromStorage,
  } = useNavigationSettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={[styles.backLabel, { color: colors.primary }]}>Settings</Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>Navigation</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.rowHeader}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Voice Guidance</Text>
            <Switch
              value={voiceGuidance}
              onValueChange={setVoiceGuidance}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
          <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
            Spoken turn-by-turn directions.
          </Text>

          <View style={[styles.rowHeader, { marginTop: 10 }]}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Voice Volume</Text>
            <Text style={[styles.emphasisLabel, { color: colors.primary }]}>
              {getVoiceVolumeLabel(voiceVolume)}
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            step={1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.text}
            value={voiceVolume}
            onValueChange={setVoiceVolume}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Route Preferences</Text>

          <View style={styles.inlineRow}>
            <View style={styles.inlineTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Avoid Stairs</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Prefer routes with elevators and ramps.
              </Text>
            </View>
            <Switch value={avoidStairs} onValueChange={setAvoidStairs} trackColor={{ false: colors.border, true: colors.primary }} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.inlineRow}>
            <View style={styles.inlineTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Indoor Navigation</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Navigate inside buildings with floor plans.
              </Text>
            </View>
            <Switch
              value={indoorNavigation}
              onValueChange={setIndoorNavigation}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.inlineRow}>
            <View style={styles.inlineTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Automatic Rerouting</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Recalculate route when off course.
              </Text>
            </View>
            <Switch
              value={autoRerouting}
              onValueChange={setAutoRerouting}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Map Display</Text>

          <View style={styles.inlineRow}>
            <View style={styles.inlineTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Show Compass</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Display compass on map view.
              </Text>
            </View>
            <Switch
              value={showCompass}
              onValueChange={setShowCompass}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.inlineRow}>
            <View style={styles.inlineTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>Show Pedestrian Traffic</Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Display busy areas on campus.
              </Text>
            </View>
            <Switch
              value={showPedestrianTraffic}
              onValueChange={setShowPedestrianTraffic}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.rowHeader}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Map Tilt Angle</Text>
            <Text style={[styles.emphasisLabel, { color: colors.primary }]}>{`${mapTiltAngle}°`}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={60}
            step={1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.text}
            value={mapTiltAngle}
            onValueChange={setMapTiltAngle}
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Units & Format</Text>

          <Pressable
            style={styles.inlineRow}
            onPress={() =>
              setDistanceUnits(distanceUnits === "Meters" ? "Feet" : "Meters")
            }
          >
            <Text style={[styles.inlineLabel, { color: colors.text }]}>Distance Units</Text>
            <Text style={[styles.inlineValue, { color: colors.primary }]}>{distanceUnits}</Text>
          </Pressable>

          <Pressable
            style={styles.inlineRow}
            onPress={() =>
              setMapStyle(mapStyle === "Standard" ? "Satellite" : "Standard")
            }
          >
            <Text style={[styles.inlineLabel, { color: colors.text }]}>Map Style</Text>
            <Text style={[styles.inlineValue, { color: colors.primary }]}>{mapStyle}</Text>
          </Pressable>

          <Pressable
            style={styles.inlineRow}
            onPress={() =>
              setNorthOrientation(
                northOrientation === "Fixed" ? "Compass" : "Fixed",
              )
            }
          >
            <Text style={[styles.inlineLabel, { color: colors.text }]}>North Orientation</Text>
            <Text style={[styles.inlineValue, { color: colors.primary }]}>{northOrientation}</Text>
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
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
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
  inlineTextCol: {
    flex: 1,
    paddingRight: 8,
  },
  inlineLabel: {
    fontSize: 14,
  },
  inlineValue: {
    fontSize: 14,
    fontWeight: "600",
  },
});

