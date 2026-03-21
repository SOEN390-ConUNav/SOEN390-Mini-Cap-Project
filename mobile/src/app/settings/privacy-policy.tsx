import React from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();

  return (
    <SettingsScreenScaffold
      title="Privacy Policy"
      backLabel="Location & Privacy"
      titleStyle={styles.titleOverride}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        1. What we collect
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        ConUNav collects limited information required to provide campus
        navigation and shuttle planning. This may include:
      </Text>
      <Text style={[styles.bullet, { color: colors.textMuted }]}>
        • Your approximate or precise location.
      </Text>
      <Text style={[styles.bullet, { color: colors.textMuted }]}>
        • Search queries such as building names or points of interest.
      </Text>
      <Text style={[styles.bullet, { color: colors.textMuted }]}>
        • Anonymous usage statistics (when enabled) such as feature usage and
        crash reports.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        2. How we use your information
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        Your location is used only to calculate directions and display your
        position on the map. Search queries are used to find and rank relevant
        results. When anonymous usage data is enabled, aggregate statistics are
        used to improve reliability and user experience.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        3. How long we keep it
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        Location data is not stored permanently on your device and is not kept
        after a navigation session ends. Aggregated analytics may be retained
        for trend analysis but cannot be linked back to an individual user.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        4. Third‑party services
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        ConUNav relies on third‑party providers (such as map and directions
        APIs) to compute routes and display map tiles. These providers may
        temporarily process your IP address and location in order to respond to
        navigation requests.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        5. Your choices
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        You control whether ConUNav can access your location and whether
        anonymous usage data is shared. You can:
      </Text>
      <Text style={[styles.bullet, { color: colors.textMuted }]}>
        • Toggle location access and other privacy options in the Location &
        Privacy settings.
      </Text>
      <Text style={[styles.bullet, { color: colors.textMuted }]}>
        • Revoke location permissions at any time from your device&apos;s
        Settings app.
      </Text>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        6. Contact
      </Text>
      <Text style={[styles.paragraph, { color: colors.textMuted }]}>
        For questions about this policy or how your data is handled, please
        contact your course team or project maintainers.
      </Text>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  titleOverride: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});
