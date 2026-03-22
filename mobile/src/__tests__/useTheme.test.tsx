import React from "react";
import { View, Text } from "react-native";
import { render } from "@testing-library/react-native";
import { useTheme } from "../hooks/useTheme";
import { LIGHT_THEME, DARK_THEME } from "../theme/theme";

const mockHydrate = jest.fn();
let mockDarkMode = false;

jest.mock("../hooks/useDisplaySettings", () => ({
  useDisplaySettings: () => ({
    darkMode: mockDarkMode,
    hydrateFromStorage: mockHydrate,
  }),
}));

function TestConsumer() {
  const { isDark, colors } = useTheme();
  return (
    <View testID="theme-consumer">
      <Text testID="mode">{isDark ? "dark" : "light"}</Text>
      <Text testID="background">{colors.background}</Text>
      <Text testID="text">{colors.text}</Text>
      <Text testID="primary">{colors.primary}</Text>
    </View>
  );
}

describe("useTheme", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDarkMode = false;
  });

  it("returns light theme when darkMode is false", () => {
    const { getByTestId } = render(<TestConsumer />);
    expect(getByTestId("mode").props.children).toBe("light");
    expect(getByTestId("background").props.children).toBe(
      LIGHT_THEME.background,
    );
    expect(getByTestId("text").props.children).toBe(LIGHT_THEME.text);
    expect(getByTestId("primary").props.children).toBe(LIGHT_THEME.primary);
  });

  it("returns dark theme when darkMode is true", () => {
    mockDarkMode = true;
    const { getByTestId } = render(<TestConsumer />);
    expect(getByTestId("mode").props.children).toBe("dark");
    expect(getByTestId("background").props.children).toBe(
      DARK_THEME.background,
    );
    expect(getByTestId("text").props.children).toBe(DARK_THEME.text);
    expect(getByTestId("primary").props.children).toBe(DARK_THEME.primary);
  });

  it("calls hydrateFromStorage on mount", () => {
    render(<TestConsumer />);
    expect(mockHydrate).toHaveBeenCalled();
  });
});
