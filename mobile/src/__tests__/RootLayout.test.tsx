import React from "react";
import { render } from "@testing-library/react-native";
import RootLayout from "../app/_layout";

jest.mock("../components/BottomNav", () => {
  const { View, Text } = require("react-native");
  return () => (
    <View>
      <Text testID="bottom-nav">nav</Text>
    </View>
  );
});

jest.mock("react-native-gesture-handler", () => {
  const { View } = require("react-native");
  return { GestureHandlerRootView: View };
});

jest.mock(
  "@gorhom/bottom-sheet",
  () => ({
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) =>
      children,
  }),
  { virtual: true },
);

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: { background: "#ffffff", tabBarBackground: "#ffffff" },
    isDark: false,
  }),
}));

const mockHydrateDisplay = jest.fn().mockResolvedValue(undefined);
const mockHydrateA11y = jest.fn().mockResolvedValue(undefined);

jest.mock("../hooks/useDisplaySettings", () => ({
  useDisplaySettingsStore: jest.fn(() => ({
    brightness: 100,
    autoBrightness: true,
    darkMode: false,
    hydrateFromStorage: mockHydrateDisplay,
  })),
}));

jest.mock("../hooks/useAccessibilitySettings", () => ({
  useAccessibilitySettingsStore: {
    getState: () => ({ hydrateFromStorage: mockHydrateA11y }),
  },
}));

describe("RootLayout", () => {
  it("renders themed root with bottom nav", () => {
    const { getByTestId } = render(<RootLayout />);
    expect(getByTestId("bottom-nav")).toBeTruthy();
  });
});
