import {
  useAccessibilitySettingsStore,
  getFontSizeLabel,
  getFontWeightLabel,
} from "../hooks/useAccessibilitySettings";
import type { CachedAccessibilityPrefs } from "../services/accessibilitySettingsCache";

let mockSavedPrefs: CachedAccessibilityPrefs | null = null;

jest.mock("../services/accessibilitySettingsCache", () => ({
  getCachedAccessibilityPrefs: jest.fn(() => Promise.resolve(mockSavedPrefs)),
  setCachedAccessibilityPrefs: jest.fn(
    async (prefs: CachedAccessibilityPrefs) => {
      mockSavedPrefs = prefs;
    },
  ),
}));

const defaultPrefs: CachedAccessibilityPrefs = {
  colorBlindMode: false,
  highContrastMode: false,
  reduceMotion: false,
  wheelchairUser: false,
  fontSize: "medium",
  fontWeight: "regular",
};

function resetStoreToDefaults() {
  useAccessibilitySettingsStore.setState({
    colorBlindMode: false,
    highContrastMode: false,
    reduceMotion: false,
    wheelchairUser: false,
    fontSize: "medium",
    fontWeight: "regular",
  });
}

describe("Accessibility settings local persistence (acceptance)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSavedPrefs = null;
    resetStoreToDefaults();
  });

  it("Given the app is running, when the user opens the settings view, then their saved accessibility preferences are displayed", async () => {
    mockSavedPrefs = {
      ...defaultPrefs,
      wheelchairUser: true,
      fontSize: "large",
      fontWeight: "bold",
    };

    await useAccessibilitySettingsStore.getState().hydrateFromStorage();

    const state = useAccessibilitySettingsStore.getState();
    expect(state.wheelchairUser).toBe(true);
    expect(state.fontSize).toBe("large");
    expect(state.fontWeight).toBe("bold");
    expect(getFontSizeLabel(state.fontSize)).toBe("Large");
    expect(getFontWeightLabel(state.fontWeight)).toBe("Bold");
  });

  it("Given the user changes an accessibility preference, when they leave and return to the settings view, then the updated preference remains saved", async () => {
    await useAccessibilitySettingsStore.getState().hydrateFromStorage();
    expect(useAccessibilitySettingsStore.getState().fontSize).toBe("medium");

    useAccessibilitySettingsStore.getState().setFontSize("large");
    expect(useAccessibilitySettingsStore.getState().fontSize).toBe("large");
    expect(mockSavedPrefs?.fontSize).toBe("large");

    await useAccessibilitySettingsStore.getState().hydrateFromStorage();
    expect(useAccessibilitySettingsStore.getState().fontSize).toBe("large");
  });

  it("Given the user has set accessibility preferences, when they close and restart the app, then their preferences are still saved on the device", async () => {
    useAccessibilitySettingsStore.getState().setFontSize("small");
    useAccessibilitySettingsStore.getState().toggleHighContrastMode();
    expect(mockSavedPrefs?.fontSize).toBe("small");
    expect(mockSavedPrefs?.highContrastMode).toBe(true);

    resetStoreToDefaults();
    expect(useAccessibilitySettingsStore.getState().fontSize).toBe("medium");
    expect(useAccessibilitySettingsStore.getState().highContrastMode).toBe(
      false,
    );

    await useAccessibilitySettingsStore.getState().hydrateFromStorage();
    expect(useAccessibilitySettingsStore.getState().fontSize).toBe("small");
    expect(useAccessibilitySettingsStore.getState().highContrastMode).toBe(
      true,
    );
  });

  it("Given no accessibility preferences were previously set, when the user opens settings, then default accessibility preferences are shown", async () => {
    mockSavedPrefs = null;

    await useAccessibilitySettingsStore.getState().hydrateFromStorage();

    const state = useAccessibilitySettingsStore.getState();
    expect(state.colorBlindMode).toBe(false);
    expect(state.highContrastMode).toBe(false);
    expect(state.reduceMotion).toBe(false);
    expect(state.wheelchairUser).toBe(false);
    expect(state.fontSize).toBe("medium");
    expect(state.fontWeight).toBe("regular");
    expect(getFontSizeLabel(state.fontSize)).toBe("Medium");
    expect(getFontWeightLabel(state.fontWeight)).toBe("Regular");
  });
});
