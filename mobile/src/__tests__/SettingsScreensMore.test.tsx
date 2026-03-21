import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SettingsNavigation from "../app/settings/navigation";
import SettingsDisplay from "../app/settings/display";
import SettingsGeneral from "../app/settings/general";
import SettingsNotifications from "../app/settings/notifications";
import LocationPermissionTutorial from "../app/settings/location-permission-tutorial";
import SettingsAbout from "../app/settings/about";
import SettingsTerms from "../app/settings/terms";
import PrivacyPolicyScreen from "../app/settings/privacy-policy";
import SettingsLocationPrivacy from "../app/settings/location-privacy";

const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
}));

jest.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    colors: {
      background: "#fff",
      card: "#f5f5f5",
      text: "#111",
      textMuted: "#666",
      primary: "#800020",
      border: "#ddd",
      surface: "#eee",
    },
    isDark: false,
  }),
}));

jest.mock("@expo/vector-icons", () => {
  const { Text } = require("react-native");
  return { Ionicons: ({ name }: { name: string }) => <Text>{name}</Text> };
});

jest.mock("@react-native-community/slider", () => {
  const { View } = require("react-native");
  return () => <View testID="slider" />;
});

jest.mock("../hooks/useNavigationSettings", () => ({
  useNavigationSettings: () => ({
    avoidStairs: false,
    setAvoidStairs: jest.fn(),
    hydrateFromStorage: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("../hooks/useDisplaySettings", () => ({
  useDisplaySettings: () => ({
    brightness: 80,
    autoBrightness: false,
    darkMode: false,
    colorIntensity: 100,
    setBrightness: jest.fn(),
    setAutoBrightness: jest.fn(),
    setDarkMode: jest.fn(),
    setColorIntensity: jest.fn(),
    hydrateFromStorage: jest.fn().mockResolvedValue(undefined),
  }),
  getBrightnessLabel: (n: number) => `${n}%`,
}));

jest.mock("../hooks/useGeneralSettings", () => ({
  useGeneralSettings: () => ({
    defaultCampus: "SGW" as const,
    setDefaultCampus: jest.fn(),
    hydrateFromStorage: jest.fn().mockResolvedValue(undefined),
  }),
  getCampusLabel: (c: string) => c,
}));

jest.mock("../hooks/useNotificationSettings", () => ({
  useNotificationSettings: () => ({
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    badgeEnabled: true,
    classUpdates: true,
    eventReminders: true,
    campusAlerts: true,
    navigationUpdates: false,
    promotionsTips: false,
    quietHoursActive: false,
    quietHoursLabel: "Off",
    setPushEnabled: jest.fn(),
    setSoundEnabled: jest.fn(),
    setVibrationEnabled: jest.fn(),
    setBadgeEnabled: jest.fn(),
    setClassUpdates: jest.fn(),
    setEventReminders: jest.fn(),
    setCampusAlerts: jest.fn(),
    setNavigationUpdates: jest.fn(),
    setPromotionsTips: jest.fn(),
    hydrateFromStorage: jest.fn().mockResolvedValue(undefined),
  }),
}));

const mockOpenSettings = jest.fn().mockResolvedValue(undefined);
jest.mock("expo-linking", () => ({
  openSettings: (...args: unknown[]) => mockOpenSettings(...args),
}));

describe("Additional settings screens", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("SettingsNavigation renders and back works", () => {
    const { getByText } = render(<SettingsNavigation />);
    expect(getByText("Navigation")).toBeTruthy();
    fireEvent.press(getByText("Settings"));
    expect(mockBack).toHaveBeenCalled();
  });

  it("SettingsDisplay renders", () => {
    const { getByText } = render(<SettingsDisplay />);
    expect(getByText("Display & Brightness")).toBeTruthy();
  });

  it("SettingsGeneral renders", () => {
    const { getByText } = render(<SettingsGeneral />);
    expect(getByText("General")).toBeTruthy();
  });

  it("SettingsNotifications renders quiet hours section", () => {
    const { getByText } = render(<SettingsNotifications />);
    expect(getByText("Notifications")).toBeTruthy();
    expect(getByText("Quiet Hours")).toBeTruthy();
  });

  it("LocationPermissionTutorial renders", () => {
    const { getByText } = render(<LocationPermissionTutorial />);
    expect(getByText("Enable Location Services")).toBeTruthy();
  });

  it("LocationPermissionTutorial opens device settings from primary button", async () => {
    const { getByText } = render(<LocationPermissionTutorial />);
    fireEvent.press(getByText("Open Device Settings"));
    await waitFor(() => expect(mockOpenSettings).toHaveBeenCalled());
  });

  it("SettingsAbout renders", () => {
    const { getByText } = render(<SettingsAbout />);
    expect(getByText("About")).toBeTruthy();
    expect(getByText("ConUNav")).toBeTruthy();
  });

  it("SettingsTerms renders", () => {
    const { getByText } = render(<SettingsTerms />);
    expect(getByText("Terms of Service")).toBeTruthy();
  });

  it("PrivacyPolicyScreen renders", () => {
    const { getByText } = render(<PrivacyPolicyScreen />);
    expect(getByText("Privacy Policy")).toBeTruthy();
  });

  it("SettingsLocationPrivacy renders", () => {
    const { getByText } = render(<SettingsLocationPrivacy />);
    expect(getByText("Location & Privacy")).toBeTruthy();
    expect(getByText("Location Services")).toBeTruthy();
  });
});
