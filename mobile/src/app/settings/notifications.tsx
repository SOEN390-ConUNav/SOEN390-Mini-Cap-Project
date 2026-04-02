import React, { useEffect } from "react";
import { useNotificationSettings } from "../../hooks/useNotificationSettings";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsCard,
  SettingsDivider,
  SettingsSectionLabel,
  SettingsSwitchRow,
} from "../../components/settings";

const PREF_TITLE = { fontSize: 14, fontWeight: "600" as const };
const PREF_SUBTITLE = { fontSize: 13, marginTop: 2 };

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
      <SettingsCard>
        <SettingsSwitchRow
          title="Push Notifications"
          subtitle="Receive notifications from the app."
          value={pushEnabled}
          onValueChange={setPushEnabled}
          subtitleBelow
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Notification Style</SettingsSectionLabel>
        <SettingsSwitchRow
          title="Sound"
          subtitle="Play sound for notifications."
          value={soundEnabled}
          onValueChange={setSoundEnabled}
          compact
          titleStyle={[PREF_TITLE, { color: colors.text }]}
          subtitleStyle={[PREF_SUBTITLE, { color: colors.textMuted }]}
        />
        <SettingsDivider />
        <SettingsSwitchRow
          title="Vibration"
          subtitle="Vibrate for notifications."
          value={vibrationEnabled}
          onValueChange={setVibrationEnabled}
          compact
          titleStyle={[PREF_TITLE, { color: colors.text }]}
          subtitleStyle={[PREF_SUBTITLE, { color: colors.textMuted }]}
        />
        <SettingsDivider />
        <SettingsSwitchRow
          title="Badge App Icon"
          subtitle="Show notification count on app icon."
          value={badgeEnabled}
          onValueChange={setBadgeEnabled}
          compact
          titleStyle={[PREF_TITLE, { color: colors.text }]}
          subtitleStyle={[PREF_SUBTITLE, { color: colors.textMuted }]}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSectionLabel>Notification Types</SettingsSectionLabel>
        <SettingsSwitchRow
          title="Class Updates"
          subtitle="Changes to class schedules and locations."
          value={classUpdates}
          onValueChange={setClassUpdates}
          compact
          titleStyle={[PREF_TITLE, { color: colors.text }]}
          subtitleStyle={[PREF_SUBTITLE, { color: colors.textMuted }]}
        />
        <SettingsDivider />
        <SettingsSwitchRow
          title="Event Reminders"
          subtitle="Upcoming campus events and activities."
          value={eventReminders}
          onValueChange={setEventReminders}
          compact
          titleStyle={[PREF_TITLE, { color: colors.text }]}
          subtitleStyle={[PREF_SUBTITLE, { color: colors.textMuted }]}
        />
        <SettingsDivider />
        <SettingsSwitchRow
          title="Campus Alerts"
          subtitle="Important safety and emergency notifications."
          value={campusAlerts}
          onValueChange={setCampusAlerts}
          compact
          titleStyle={[PREF_TITLE, { color: colors.text }]}
          subtitleStyle={[PREF_SUBTITLE, { color: colors.textMuted }]}
        />
        <SettingsDivider />
        <SettingsSwitchRow
          title="Navigation Updates"
          subtitle="Real-time navigation and route updates."
          value={navigationUpdates}
          onValueChange={setNavigationUpdates}
          compact
          titleStyle={[PREF_TITLE, { color: colors.text }]}
          subtitleStyle={[PREF_SUBTITLE, { color: colors.textMuted }]}
        />
        <SettingsDivider />
        <SettingsSwitchRow
          title="Promotions & Tips"
          subtitle="News, tips, and promotional content."
          value={promotionsTips}
          onValueChange={setPromotionsTips}
          compact
          titleStyle={[PREF_TITLE, { color: colors.text }]}
          subtitleStyle={[PREF_SUBTITLE, { color: colors.textMuted }]}
        />
      </SettingsCard>

      <SettingsCard>
        <SettingsSwitchRow
          title="Quiet Hours"
          subtitle={quietHoursLabel}
          value={quietHoursActive}
          onValueChange={setQuietHoursActive}
          subtitleBelow
        />
      </SettingsCard>
    </SettingsScreenScaffold>
  );
}
