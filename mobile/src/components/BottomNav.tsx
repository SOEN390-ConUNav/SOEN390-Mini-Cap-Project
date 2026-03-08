import React from "react";
import { StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useAccessibilitySettings } from "../hooks/useAccessibilitySettings";
import { useTheme } from "../hooks/useTheme";

const TABS = [
  {
    name: "settings",
    title: "Settings",
    iconFocused: "settings",
    iconOutline: "settings-outline",
  },
  {
    name: "(home-page)",
    title: "Map",
    iconFocused: "location",
    iconOutline: "location-outline",
  },
  {
    name: "shuttle-info/index",
    title: "Shuttle",
    iconFocused: "bus",
    iconOutline: "bus-outline",
  },
] as const;

const createTabBarStyle = (tabBarBackground: string) => ({
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  right: 0,
  height: 78,
  paddingBottom: 18,
  paddingTop: 10,
  backgroundColor: tabBarBackground,
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: -4 },
  elevation: 10,
  borderTopWidth: 0,
});

export const tabBarItemStyle = {
  width: 52,
  alignItems: "center" as const,
  justifyContent: "center" as const,
};

/** Used by home page to show tab bar with correct theme (e.g. after hiding during navigation). */
export function useTabBarStyle() {
  const { colors } = useTheme();
  return createTabBarStyle(colors.tabBarBackground);
}

export default function BottomNav() {
  const { colorBlindMode, highContrastMode } = useAccessibilitySettings();
  const { colors } = useTheme();

  const primaryColor = highContrastMode
    ? "#000000"
    : colorBlindMode
    ? "#005F99"
    : colors.primary;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: createTabBarStyle(colors.tabBarBackground),
        tabBarItemStyle,
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: primaryColor,
        tabBarShowLabel: false,
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.iconOutline}
                color={primaryColor}
                size={22}
              />
            ),
          }}
        />
      ))}
      {/* Hide settings sub-screens from the tab bar so only the root appears */}
      <Tabs.Screen name="settings/general" options={{ href: null }} />
      <Tabs.Screen name="settings/display" options={{ href: null }} />
      <Tabs.Screen name="settings/notifications" options={{ href: null }} />
      <Tabs.Screen name="settings/location-privacy" options={{ href: null }} />
      <Tabs.Screen name="settings/navigation" options={{ href: null }} />
      <Tabs.Screen name="settings/accessibility" options={{ href: null }} />
      <Tabs.Screen name="settings/about" options={{ href: null }} />
      <Tabs.Screen name="settings/terms" options={{ href: null }} />
      <Tabs.Screen name="indoor-navigation" options={{ href: null }} />
    </Tabs>
  );
}
