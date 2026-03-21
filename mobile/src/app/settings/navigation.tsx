import React, { useEffect } from "react";
import { StyleSheet, Text, View, Switch } from "react-native";
import { useNavigationSettings } from "../../hooks/useNavigationSettings";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";

export default function SettingsNavigation() {
  const { colors } = useTheme();
  const { avoidStairs, setAvoidStairs, hydrateFromStorage } =
    useNavigationSettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <SettingsScreenScaffold title="Navigation">
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
