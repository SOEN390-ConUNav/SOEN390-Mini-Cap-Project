import React from "react";
import { StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useTheme } from "../../hooks/useTheme";

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={[styles.backLabel, { color: colors.primary }]}>
          Location & Privacy
        </Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>
        Enable Location Services
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={styles.stepHeaderRow}>
            <View
              style={[
                styles.stepIconCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="settings-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
                Step 1
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Open your device Settings
              </Text>
            </View>
          </View>
          <Text style={[styles.stepBody, { color: colors.textMuted }]}>
            Tap the Settings app on your home screen.
          </Text>
        </View>

        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={styles.stepHeaderRow}>
            <View
              style={[
                styles.stepIconCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="shield-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
                Step 2
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Go to Privacy & Location
              </Text>
            </View>
          </View>
          <Text style={[styles.stepBody, { color: colors.textMuted }]}>
            Find and select{" "}
            <Text style={[styles.bold, { color: colors.text }]}>Privacy</Text>,
            then{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              Location Services
            </Text>
            .
          </Text>
        </View>

        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={styles.stepHeaderRow}>
            <View
              style={[
                styles.stepIconCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons name="apps-outline" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
                Step 3
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Select the campus navigation app
              </Text>
            </View>
          </View>
          <Text style={[styles.stepBody, { color: colors.textMuted }]}>
            Scroll through the list and select{" "}
            <Text style={[styles.bold, { color: colors.text }]}>ConUNav</Text>{" "}
            (campus navigation app).
          </Text>
        </View>

        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={styles.stepHeaderRow}>
            <View
              style={[
                styles.stepIconCircle,
                { backgroundColor: colors.primary },
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
                Step 4
              </Text>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Choose &quot;Allow While Using the App&quot;
              </Text>
            </View>
          </View>
          <Text style={[styles.stepBody, { color: colors.textMuted }]}>
            Under{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              Location access
            </Text>
            , select{" "}
            <Text style={[styles.bold, { color: colors.text }]}>
              Allow while using the app
            </Text>{" "}
            so ConUNav can determine your position only when you&apos;re
            actively using it.
          </Text>
        </View>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              void openSettings();
            }}
          >
            <Text style={styles.primaryButtonText}>Open Device Settings</Text>
          </Pressable>

          <Pressable
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => router.back()}
          >
            <Text
              style={[styles.secondaryButtonText, { color: colors.textMuted }]}
            >
              Skip for Now
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backLabel: { fontSize: 17, marginLeft: 4 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  stepCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  stepHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
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
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
