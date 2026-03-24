import React from "react";
import { render, renderHook } from "@testing-library/react-native";
import BottomNav, { useTabBarStyle } from "../components/BottomNav";

const mockAccessibility = { colorBlindMode: false };

jest.mock("expo-router", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  const Tabs = ({
    children,
    screenOptions,
  }: {
    children: React.ReactNode;
    screenOptions?: { tabBarActiveTintColor?: string };
  }) => (
    <View
      testID="tabs-root"
      data-active-tint={String(screenOptions?.tabBarActiveTintColor ?? "")}
    >
      {children}
    </View>
  );
  Tabs.Screen = ({ name }: { name: string }) => (
    <View testID={`tab-screen-${name}`}>
      <Text>{name}</Text>
    </View>
  );
  return { Tabs };
});

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: { primary: "#800020", tabBarBackground: "#ffffff" },
    isDark: false,
  }),
}));

jest.mock("../hooks/useAccessibilitySettings", () => ({
  useAccessibilitySettings: () => mockAccessibility,
}));

describe("BottomNav", () => {
  beforeEach(() => {
    mockAccessibility.colorBlindMode = false;
  });

  it("renders Tabs with settings, map, shuttle, and hidden indoor-navigation", () => {
    const { getByTestId } = render(<BottomNav />);
    expect(getByTestId("tabs-root")).toBeTruthy();
    expect(getByTestId("tab-screen-settings")).toBeTruthy();
    expect(getByTestId("tab-screen-(home-page)")).toBeTruthy();
    expect(getByTestId("tab-screen-shuttle-info/index")).toBeTruthy();
    expect(getByTestId("tab-screen-indoor-navigation")).toBeTruthy();
  });

  it("uses theme primary for tab tint when colorBlindMode is false", () => {
    const { getByTestId } = render(<BottomNav />);
    expect(getByTestId("tabs-root").props["data-active-tint"]).toBe("#800020");
  });

  it("uses color-blind primary for tab tint when colorBlindMode is true", () => {
    mockAccessibility.colorBlindMode = true;
    const { getByTestId } = render(<BottomNav />);
    expect(getByTestId("tabs-root").props["data-active-tint"]).toBe("#005F99");
  });

  it("useTabBarStyle returns style using theme tab bar background", () => {
    const { result } = renderHook(() => useTabBarStyle());
    expect(result.current.backgroundColor).toBe("#ffffff");
    expect(result.current.height).toBe(78);
  });
});
