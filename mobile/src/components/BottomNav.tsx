import React from "react";
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

type TabConfig = (typeof TABS)[number];

type BottomNavIconProps = {
  readonly focused: boolean;
  readonly iconFocused: TabConfig["iconFocused"];
  readonly iconOutline: TabConfig["iconOutline"];
  readonly color: string;
};

type TabBarIconRendererProps = {
  readonly focused: boolean;
  readonly color: string;
};

function BottomNavIcon({
  focused,
  iconFocused,
  iconOutline,
  color,
}: BottomNavIconProps) {
  return (
    <Ionicons
      name={focused ? iconFocused : iconOutline}
      color={color}
      size={22}
    />
  );
}

const TAB_ICON_RENDERERS: Record<
  TabConfig["name"],
  ({ focused, color }: TabBarIconRendererProps) => React.JSX.Element
> = {
  settings: ({ focused, color }) => (
    <BottomNavIcon
      focused={focused}
      iconFocused="settings"
      iconOutline="settings-outline"
      color={color}
    />
  ),
  "(home-page)": ({ focused, color }) => (
    <BottomNavIcon
      focused={focused}
      iconFocused="location"
      iconOutline="location-outline"
      color={color}
    />
  ),
  "shuttle-info/index": ({ focused, color }) => (
    <BottomNavIcon
      focused={focused}
      iconFocused="bus"
      iconOutline="bus-outline"
      color={color}
    />
  ),
};

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
  const { colorBlindMode } = useAccessibilitySettings();
  const { colors } = useTheme();

  const primaryColor = colorBlindMode ? "#005F99" : colors.primary;

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
            tabBarIcon: TAB_ICON_RENDERERS[tab.name],
          }}
        />
      ))}
      {/* Stack screens like settings/general live under settings/_layout — not tab siblings; do not register them here (causes Expo Router warnings). */}
      <Tabs.Screen name="indoor-navigation" options={{ href: null }} />
    </Tabs>
  );
}
