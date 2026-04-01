import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { SettingsScreenScaffold } from "../../components/settings/SettingsScreenScaffold";
import { SettingsCard } from "../../components/settings";

export default function SettingsAbout() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <SettingsScreenScaffold title="About">
      <SettingsCard>
        <View style={styles.appHeaderRow}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <Text style={styles.appIconLetter}>C</Text>
          </View>
          <View>
            <Text style={[styles.appName, { color: colors.text }]}>
              ConUNav
            </Text>
            <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>
              Concordia University
            </Text>
            <Text style={[styles.appSubtitle, { color: colors.textMuted }]}>
              Version 2.3.1 (Build 145)
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          About This App
        </Text>
        <Text style={[styles.paragraph, { color: colors.textMuted }]}>
          ConUNav is your comprehensive guide to navigating Concordia
          University&apos;s campuses. Find your way to classes, discover campus
          facilities, and explore everything our university has to offer with
          ease and accessibility.
        </Text>
      </SettingsCard>

      <SettingsCard>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Key Features
        </Text>
        <Text style={[styles.bullet, { color: colors.textMuted }]}>
          • Turn-by-turn indoor and outdoor navigation.
        </Text>
        <Text style={[styles.bullet, { color: colors.textMuted }]}>
          • Interactive campus maps with building details.
        </Text>
        <Text style={[styles.bullet, { color: colors.textMuted }]}>
          • Accessibility-first design with customization options.
        </Text>
        <Text style={[styles.bullet, { color: colors.textMuted }]}>
          • Real-time location tracking and route updates.
        </Text>
        <Text style={[styles.bullet, { color: colors.textMuted }]}>
          • Offline map support for uninterrupted navigation.
        </Text>
      </SettingsCard>

      <SettingsCard>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Development Team
        </Text>
        <Text style={[styles.paragraph, { color: colors.textMuted }]}>
          Developed by the SOEN390 Mini-Capstone project team at Concordia
          University.
        </Text>
        <Text
          style={[styles.paragraph, { marginTop: 8, color: colors.textMuted }]}
        >
          Made with <Text style={{ color: colors.primary }}>❤️</Text> in
          Montreal.
        </Text>
      </SettingsCard>

      <SettingsCard>
        <Pressable style={styles.rowLink}>
          <View style={styles.rowLinkLeft}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <Text style={[styles.rowLinkText, { color: colors.primary }]}>
              Contact Support
            </Text>
          </View>
        </Pressable>

        <Pressable
          style={styles.rowLink}
          onPress={() => router.push("/settings/terms")}
        >
          <View style={styles.rowLinkLeft}>
            <Ionicons
              name="document-text-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.rowLinkText, { color: colors.primary }]}>
              Terms of Service
            </Text>
          </View>
        </Pressable>
      </SettingsCard>

      <Text style={[styles.footerText, { color: colors.textMuted }]}>
        © 2026 Concordia University. All rights reserved.
      </Text>
    </SettingsScreenScaffold>
  );
}

const styles = StyleSheet.create({
  appHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  appIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  appIconLetter: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "700",
  },
  appName: {
    fontSize: 20,
    fontWeight: "700",
  },
  appSubtitle: {
    fontSize: 13,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  rowLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  rowLinkLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: "center",
  },
});
