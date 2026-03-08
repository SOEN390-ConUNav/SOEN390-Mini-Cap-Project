import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SettingsAccessibility from "../app/settings/accessibility";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      background: "#121212",
      card: "#2d2d2d",
      text: "#f5f5f5",
      textMuted: "#b0b0b0",
      primary: "#c04050",
      border: "#404040",
    },
  }),
}));

jest.mock("../hooks/useAccessibilitySettings", () => {
  const actual = jest.requireActual("../hooks/useAccessibilitySettings");
  return {
    ...actual,
    useAccessibilitySettings: () => ({
      colorBlindMode: false,
      highContrastMode: false,
      reduceMotion: false,
      wheelchairUser: false,
      fontSize: "medium" as const,
      fontWeight: "regular" as const,
      toggleColorBlindMode: jest.fn(),
      toggleHighContrastMode: jest.fn(),
      toggleReduceMotion: jest.fn(),
      toggleWheelchairUser: jest.fn(),
      setFontSize: jest.fn(),
      setFontWeight: jest.fn(),
      hydrateFromStorage: jest.fn(),
    }),
  };
});

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe("SettingsAccessibility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Accessibility Settings title", () => {
    const { getByText } = render(<SettingsAccessibility />);
    expect(getByText("Accessibility Settings")).toBeTruthy();
  });

  it("renders back row with Settings", () => {
    const { getByText } = render(<SettingsAccessibility />);
    expect(getByText("Settings")).toBeTruthy();
  });

  it("renders I use a wheelchair card", () => {
    const { getByText } = render(<SettingsAccessibility />);
    expect(
      getByText("Prioritize accessible routes and elevator or ramp options"),
    ).toBeTruthy();
    expect(getByText("I use a wheelchair")).toBeTruthy();
  });

  it("renders Font Size section with preview", () => {
    const { getByText } = render(<SettingsAccessibility />);
    expect(getByText("Font Size")).toBeTruthy();
    expect(getByText("Make text larger throughout the app")).toBeTruthy();
    expect(getByText("This is how text will look")).toBeTruthy();
  });

  it("renders Text Weight section", () => {
    const { getByText } = render(<SettingsAccessibility />);
    expect(getByText("Text Weight")).toBeTruthy();
    expect(getByText("Adjust how bold text appears")).toBeTruthy();
    expect(getByText("Bold preview text")).toBeTruthy();
  });

  it("renders High Contrast Mode and Reduce Motion", () => {
    const { getByText } = render(<SettingsAccessibility />);
    expect(getByText("High Contrast Mode")).toBeTruthy();
    expect(getByText("Reduce Motion")).toBeTruthy();
  });

  it("calls router.back when back row is pressed", () => {
    const { getByText } = render(<SettingsAccessibility />);
    fireEvent.press(getByText("Settings"));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
