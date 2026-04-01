import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import {
  SettingsOutlinedButton,
  SettingsPrimaryButton,
  SettingsStepCard,
} from "../../components/settings";

export default function LocationPermissionTutorial() {
  const router = useRouter();
  const { colors } = useTheme();

  const openSettings = async () => {
    try {
      await Linking.openSettings();
    } catch {
      // best-effort; if it fails, the copy below still explains what to do
    }
  };

  return (
    <SettingsScreenScaffold
      title="Enable Location Services"
      backLabel="Location & Privacy"
      titleStyle={styles.titleOverride}
    >
      <SettingsStepCard
        stepLabel="Step 1"
        title="Open your device Settings"
        icon="settings-outline"
      >
        <Text style={[styles.stepBody, { color: colors.textMuted }]}>
          Tap the Settings app on your home screen.
        </Text>
      </SettingsStepCard>

      <SettingsStepCard
        stepLabel="Step 2"
        title="Go to Privacy & Location"
        icon="shield-outline"
      >
        <Text style={[styles.stepBody, { color: colors.textMuted }]}>
          Find and select{" "}
          <Text style={[styles.bold, { color: colors.text }]}>Privacy</Text>,
          then{" "}
          <Text style={[styles.bold, { color: colors.text }]}>
            Location Services
          </Text>
          .
        </Text>
      </SettingsStepCard>

      <SettingsStepCard
        stepLabel="Step 3"
        title="Select the campus navigation app"
        icon="apps-outline"
      >
        <Text style={[styles.stepBody, { color: colors.textMuted }]}>
          Scroll through the list and select{" "}
          <Text style={[styles.bold, { color: colors.text }]}>ConUNav</Text>{" "}
          (campus navigation app).
        </Text>
      </SettingsStepCard>

      <SettingsStepCard
        stepLabel="Step 4"
        title='Choose "Allow While Using the App"'
        icon="checkmark-circle-outline"
      >
        <Text style={[styles.stepBody, { color: colors.textMuted }]}>
          Under{" "}
          <Text style={[styles.bold, { color: colors.text }]}>
            Location access
          </Text>
          , select{" "}
          <Text style={[styles.bold, { color: colors.text }]}>
            Allow while using the app
          </Text>{" "}
          so ConUNav can determine your position only when you&apos;re actively
          using it.
        </Text>
      </SettingsStepCard>

      <View style={styles.buttonRow}>
        <SettingsPrimaryButton
          label="Open Device Settings"
          onPress={() => {
            void openSettings();
          }}
        />
        <SettingsOutlinedButton
          label="Skip for Now"
          onPress={() => router.back()}
        />
      </View>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  titleOverride: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  stepBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "700",
  },
  buttonRow: {
    marginTop: 20,
    gap: 10,
  },
});
