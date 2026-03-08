import React from "react";
import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import useLocationService from "../../hooks/useLocationService";
import useLocationStore from "../../hooks/useLocationStore";
import { useTheme } from "../../hooks/useTheme";

export default function EnableLocation() {
  const router = useRouter();
  const params = useLocalSearchParams<{ reason?: string }>();
  const { colors } = useTheme();
  const {
    requestPermission,
    markPermissionScreenSeen,
    markUserSkipped,
    openSettings,
  } = useLocationService();
  const permissionStatus = useLocationStore((state) => state.permissionStatus);
  const canAskAgain = useLocationStore((state) => state.canAskAgain);
  const userSkippedPermission = useLocationStore(
    (state) => state.userSkippedPermission,
  );

  const isRevoked =
    params.reason === "revoked" || permissionStatus === "revoked";
  const shouldShowOSPrompt =
    !userSkippedPermission &&
    (canAskAgain || permissionStatus === "undetermined");

  const onEnableLocation = async () => {
    if (shouldShowOSPrompt) {
      const granted = await requestPermission();
      await markPermissionScreenSeen();

      if (!granted) {
        Alert.alert(
          "Permission Denied",
          "You can enable location later in device settings.",
          [
            { text: "Continue", onPress: () => router.replace("/(home-page)") },
            {
              text: "Open Settings",
              onPress: () => {
                void openSettings();
              },
            },
          ],
        );
        return;
      }

      router.replace("/(home-page)");
      return;
    }

    Alert.alert(
      "Permission Required",
      "Location permission was previously denied. Please enable it in your device settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Settings",
          onPress: () => {
            void openSettings();
          },
        },
      ],
    );
  };

  const onSkipLocation = async () => {
    await markUserSkipped();
    router.replace("/(home-page)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primary + "2E" }]}>
        <Text style={styles.icon}>{isRevoked ? "⚠️" : "📍"}</Text>
      </View>

      {isRevoked ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Location Permission Revoked</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Location access was previously granted but has been revoked. To
            continue using location features, please re-enable permission in
            your device settings.
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.title, { color: colors.text }]}>Enable Location Services</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            To help you navigate Concordia's campus, we need access to your
            location. This allows us to show your position on the map and
            provide accurate directions.
          </Text>
        </>
      )}

      <View style={styles.bullets}>
        <Bullet
          colors={colors}
          title="Real-time positioning"
          desc="See your exact location on campus"
        />
        <Bullet
          colors={colors}
          title="Turn-by-turn directions"
          desc="Navigate between buildings easily"
        />
        <Bullet
          colors={colors}
          title="Nearby points of interest"
          desc="Find cafeterias, libraries, and more"
        />
      </View>

      {shouldShowOSPrompt ? (
        <Pressable
          style={[styles.enableBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            void onEnableLocation();
          }}
        >
          <Text style={styles.enableText}>Enable Location</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.enableBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            void openSettings();
          }}
        >
          <Text style={styles.enableText}>Open Settings</Text>
        </Pressable>
      )}

      <Pressable
        style={styles.skipBtn}
        onPress={() => {
          void onSkipLocation();
        }}
      >
        <Text style={[styles.skipText, { color: colors.textMuted }]}>
          {isRevoked ? "Continue without location" : "Skip for now"}
        </Text>
      </Pressable>
    </View>
  );
}

function Bullet({
  colors,
  title,
  desc,
}: {
  colors: { text: string; textMuted: string; primary: string };
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.dot, { backgroundColor: colors.primary }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.bulletTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.bulletDesc, { color: colors.textMuted }]}>{desc}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  icon: { fontSize: 40 },

  title: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },

  bullets: { gap: 18, marginBottom: 28 },

  bulletRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  bulletTitle: { fontWeight: "700", marginBottom: 2 },
  bulletDesc: {},

  enableBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 10,
  },
  enableText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  skipBtn: { paddingVertical: 14, alignItems: "center" },
  skipText: { fontWeight: "600" },
});
