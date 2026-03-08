import AsyncStorage from "@react-native-async-storage/async-storage";
import cacheService from "../services/cacheService";
import {
  getCachedAccessibilityPrefs,
  setCachedAccessibilityPrefs,
} from "../services/accessibilitySettingsCache";

describe("accessibilitySettingsCache", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    cacheService.clearMemoryNamespace("accessibility_settings");
  });

  it("returns null when nothing is stored", async () => {
    const prefs = await getCachedAccessibilityPrefs();
    expect(prefs).toBeNull();
  });

  it("persists and returns prefs (memory then storage)", async () => {
    const prefs = {
      colorBlindMode: true,
      highContrastMode: false,
      reduceMotion: false,
      wheelchairUser: true,
      fontSize: "large" as const,
      fontWeight: "bold" as const,
    };
    await setCachedAccessibilityPrefs(prefs);

    const got = await getCachedAccessibilityPrefs();
    expect(got).toEqual(prefs);

    const gotAgain = await getCachedAccessibilityPrefs();
    expect(gotAgain).toEqual(prefs);
  });

  it("survives memory clear (reads from AsyncStorage)", async () => {
    const prefs = {
      colorBlindMode: false,
      highContrastMode: true,
      reduceMotion: true,
      wheelchairUser: false,
      fontSize: "small" as const,
      fontWeight: "light" as const,
    };
    await setCachedAccessibilityPrefs(prefs);
    cacheService.clearMemoryNamespace("accessibility_settings");

    const got = await getCachedAccessibilityPrefs();
    expect(got).toEqual(prefs);
  });
});
