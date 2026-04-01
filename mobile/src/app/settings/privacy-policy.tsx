import React from "react";
import { StyleSheet } from "react-native";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsLegalBullet,
  SettingsLegalParagraph,
  SettingsLegalSectionTitle,
} from "../../components/settings";

export default function PrivacyPolicyScreen() {
  return (
    <SettingsScreenScaffold
      title="Privacy Policy"
      backLabel="Location & Privacy"
      titleStyle={styles.titleOverride}
    >
      <SettingsLegalSectionTitle>1. What we collect</SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        ConUNav collects limited information required to provide campus
        navigation and shuttle planning. This may include:
      </SettingsLegalParagraph>
      <SettingsLegalBullet>
        • Your approximate or precise location.
      </SettingsLegalBullet>
      <SettingsLegalBullet>
        • Search queries such as building names or points of interest.
      </SettingsLegalBullet>
      <SettingsLegalBullet>
        • Anonymous usage statistics (when enabled) such as feature usage and
        crash reports.
      </SettingsLegalBullet>

      <SettingsLegalSectionTitle>
        2. How we use your information
      </SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        Your location is used only to calculate directions and display your
        position on the map. Search queries are used to find and rank relevant
        results. When anonymous usage data is enabled, aggregate statistics are
        used to improve reliability and user experience.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>
        3. How long we keep it
      </SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        Location data is not stored permanently on your device and is not kept
        after a navigation session ends. Aggregated analytics may be retained
        for trend analysis but cannot be linked back to an individual user.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>
        4. Third‑party services
      </SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        ConUNav relies on third‑party providers (such as map and directions
        APIs) to compute routes and display map tiles. These providers may
        temporarily process your IP address and location in order to respond to
        navigation requests.
      </SettingsLegalParagraph>

      <SettingsLegalSectionTitle>5. Your choices</SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        You control whether ConUNav can access your location and whether
        anonymous usage data is shared. You can:
      </SettingsLegalParagraph>
      <SettingsLegalBullet>
        • Toggle location access and other privacy options in the Location &
        Privacy settings.
      </SettingsLegalBullet>
      <SettingsLegalBullet>
        • Revoke location permissions at any time from your device&apos;s
        Settings app.
      </SettingsLegalBullet>

      <SettingsLegalSectionTitle>6. Contact</SettingsLegalSectionTitle>
      <SettingsLegalParagraph>
        For questions about this policy or how your data is handled, please
        contact your course team or project maintainers.
      </SettingsLegalParagraph>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  titleOverride: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
});
