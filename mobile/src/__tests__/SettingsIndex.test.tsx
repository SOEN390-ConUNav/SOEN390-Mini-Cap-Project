import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SettingsIndexPage from "../app/settings/index";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      background: "#ffffff",
      card: "#ffffff",
      text: "#1a1a1a",
      textMuted: "#666666",
      primary: "#800020",
      primaryBorder: "#a03040",
    },
  }),
}));

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return {
    Ionicons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe("SettingsIndexPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Settings title", () => {
    const { getByText } = render(<SettingsIndexPage />);
    expect(getByText("Settings")).toBeTruthy();
  });

  it("renders all settings menu items", () => {
    const { getByText } = render(<SettingsIndexPage />);
    expect(getByText("General")).toBeTruthy();
    expect(getByText("Display & Brightness")).toBeTruthy();
    expect(getByText("Location & Privacy")).toBeTruthy();
    expect(getByText("Navigation")).toBeTruthy();
    expect(getByText("Accessibility")).toBeTruthy();
    expect(getByText("About")).toBeTruthy();
    expect(getByText("Terms")).toBeTruthy();
  });

  it("navigates to general when General is pressed", () => {
    const { getByText } = render(<SettingsIndexPage />);
    fireEvent.press(getByText("General"));
    expect(mockPush).toHaveBeenCalledWith("/settings/general");
  });

  it("navigates to display when Display & Brightness is pressed", () => {
    const { getByText } = render(<SettingsIndexPage />);
    fireEvent.press(getByText("Display & Brightness"));
    expect(mockPush).toHaveBeenCalledWith("/settings/display");
  });

  it("navigates to location privacy when Location & Privacy is pressed", () => {
    const { getByText } = render(<SettingsIndexPage />);
    fireEvent.press(getByText("Location & Privacy"));
    expect(mockPush).toHaveBeenCalledWith("/settings/location-privacy");
  });

  it("navigates to navigation when Navigation is pressed", () => {
    const { getByText } = render(<SettingsIndexPage />);
    fireEvent.press(getByText("Navigation"));
    expect(mockPush).toHaveBeenCalledWith("/settings/navigation");
  });

  it("navigates to accessibility when Accessibility is pressed", () => {
    const { getByText } = render(<SettingsIndexPage />);
    fireEvent.press(getByText("Accessibility"));
    expect(mockPush).toHaveBeenCalledWith("/settings/accessibility");
  });

  it("navigates to about when About is pressed", () => {
    const { getByText } = render(<SettingsIndexPage />);
    fireEvent.press(getByText("About"));
    expect(mockPush).toHaveBeenCalledWith("/settings/about");
  });

  it("navigates to terms when Terms is pressed", () => {
    const { getByText } = render(<SettingsIndexPage />);
    fireEvent.press(getByText("Terms"));
    expect(mockPush).toHaveBeenCalledWith("/settings/terms");
  });
});
