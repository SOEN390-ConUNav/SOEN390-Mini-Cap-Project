import React, { useEffect } from "react";
import { StyleSheet, Text, View, Switch } from "react-native";
import { useNotificationSettings } from "../../hooks/useNotificationSettings";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";

export default function SettingsNotifications() {
  const { colors } = useTheme();
  const {
    pushEnabled,
    soundEnabled,
    vibrationEnabled,
    badgeEnabled,
    classUpdates,
    eventReminders,
    campusAlerts,
    navigationUpdates,
    promotionsTips,
    quietHoursActive,
    quietHoursLabel,
    setPushEnabled,
    setSoundEnabled,
    setVibrationEnabled,
    setBadgeEnabled,
    setClassUpdates,
    setEventReminders,
    setCampusAlerts,
    setNavigationUpdates,
    setPromotionsTips,
    setQuietHoursActive,
    hydrateFromStorage,
  } = useNotificationSettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  return (
    <SettingsScreenScaffold title="Notifications">
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Push Notifications
          </Text>
          <Switch
            value={pushEnabled}
            onValueChange={setPushEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
          Receive notifications from the app.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          Notification Style
        </Text>

        <View style={styles.prefRow}>
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>
              Sound
            </Text>
            <Text style={[styles.prefSubtitle, { color: colors.textMuted }]}>
              Play sound for notifications.
            </Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.prefRow}>
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>
              Vibration
            </Text>
            <Text style={[styles.prefSubtitle, { color: colors.textMuted }]}>
              Vibrate for notifications.
            </Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.prefRow}>
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>
              Badge App Icon
            </Text>
            <Text style={[styles.prefSubtitle, { color: colors.textMuted }]}>
              Show notification count on app icon.
            </Text>
          </View>
          <Switch
            value={badgeEnabled}
            onValueChange={setBadgeEnabled}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          Notification Types
        </Text>

        <View style={styles.prefRow}>
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>
              Class Updates
            </Text>
            <Text style={[styles.prefSubtitle, { color: colors.textMuted }]}>
              Changes to class schedules and locations.
            </Text>
          </View>
          <Switch
            value={classUpdates}
            onValueChange={setClassUpdates}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.prefRow}>
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>
              Event Reminders
            </Text>
            <Text style={[styles.prefSubtitle, { color: colors.textMuted }]}>
              Upcoming campus events and activities.
            </Text>
          </View>
          <Switch
            value={eventReminders}
            onValueChange={setEventReminders}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.prefRow}>
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>
              Campus Alerts
            </Text>
            <Text style={[styles.prefSubtitle, { color: colors.textMuted }]}>
              Important safety and emergency notifications.
            </Text>
          </View>
          <Switch
            value={campusAlerts}
            onValueChange={setCampusAlerts}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.prefRow}>
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>
              Navigation Updates
            </Text>
            <Text style={[styles.prefSubtitle, { color: colors.textMuted }]}>
              Real-time navigation and route updates.
            </Text>
          </View>
          <Switch
            value={navigationUpdates}
            onValueChange={setNavigationUpdates}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.prefRow}>
          <View style={styles.prefTextCol}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>
              Promotions & Tips
            </Text>
            <Text style={[styles.prefSubtitle, { color: colors.textMuted }]}>
              News, tips, and promotional content.
            </Text>
          </View>
          <Switch
            value={promotionsTips}
            onValueChange={setPromotionsTips}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Quiet Hours
          </Text>
          <Switch
            value={quietHoursActive}
            onValueChange={setQuietHoursActive}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
        <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
          {quietHoursLabel}
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
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 10,
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  prefTextCol: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  prefSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
});
