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
import { useNavigationSettings } from "../../hooks/useNavigationSettings";
import { useTheme } from "../../hooks/useTheme";

export default function SettingsNavigation() {
  const router = useRouter();
  const { colors } = useTheme();
  const { avoidStairs, setAvoidStairs, hydrateFromStorage } =
    useNavigationSettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={[styles.backLabel, { color: colors.primary }]}>
          Settings
        </Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }]}>Navigation</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Route Preferences
          </Text>

          <View style={styles.inlineRow}>
            <View style={styles.inlineTextCol}>
              <Text style={[styles.rowTitle, { color: colors.text }]}>
                Avoid Stairs
              </Text>
              <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
                Prefer routes with elevators and ramps.
              </Text>
            </View>
            <Switch
              value={avoidStairs}
              onValueChange={setAvoidStairs}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
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
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
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
});
