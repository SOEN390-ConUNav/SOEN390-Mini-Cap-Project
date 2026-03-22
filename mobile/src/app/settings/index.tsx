import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import type { ComponentProps } from "react";
import { useTheme } from "../../hooks/useTheme";

const SETTINGS_ITEMS: Array<{
  id: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  href: Href;
}> = [
  {
    id: "general",
    label: "General",
    icon: "options-outline",
    href: "/settings/general",
  },
  {
    id: "display",
    label: "Display & Brightness",
    icon: "sunny-outline",
    href: "/settings/display",
  },
  {
    id: "location",
    label: "Location & Privacy",
    icon: "location-outline",
    href: "/settings/location-privacy",
  },
  {
    id: "navigation",
    label: "Navigation",
    icon: "navigate-outline",
    href: "/settings/navigation",
  },
  {
    id: "accessibility",
    label: "Accessibility",
    icon: "accessibility-outline",
    href: "/settings/accessibility",
  },
  {
    id: "about",
    label: "About",
    icon: "information-circle-outline",
    href: "/settings/about",
  },
  {
    id: "terms",
    label: "Terms",
    icon: "document-text-outline",
    href: "/settings/terms",
  },
];

export default function SettingsIndexPage() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SETTINGS_ITEMS.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: colors.card },
              pressed && styles.cardPressed,
            ]}
            onPress={() => router.push(item.href)}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: colors.primary,
                  borderColor: colors.primaryBorder,
                },
              ]}
            >
              <Ionicons name={item.icon} size={22} color="#fff" />
            </View>
            <Text style={[styles.label, { color: colors.text }]}>
              {item.label}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: { opacity: 0.85 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
});
