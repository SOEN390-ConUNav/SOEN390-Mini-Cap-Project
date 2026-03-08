import AsyncStorage from "@react-native-async-storage/async-storage";
import cacheService from "./cacheService";

const STORAGE_KEY = "accessibilitySettings.v1";
const CACHE_NAMESPACE = "accessibility_settings";
const CACHE_KEY = "prefs";

export interface CachedAccessibilityPrefs {
  colorBlindMode: boolean;
  highContrastMode: boolean;
  reduceMotion: boolean;
  wheelchairUser: boolean;
  fontSize: "small" | "medium" | "large";
  fontWeight: "light" | "regular" | "bold";
}

export async function getCachedAccessibilityPrefs(): Promise<CachedAccessibilityPrefs | null> {
  const fromMemory = cacheService.getMemory<CachedAccessibilityPrefs>(
    CACHE_NAMESPACE,
    CACHE_KEY,
  );
  if (fromMemory) return fromMemory;

  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CachedAccessibilityPrefs;
    cacheService.setMemory(CACHE_NAMESPACE, CACHE_KEY, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedAccessibilityPrefs(
  prefs: CachedAccessibilityPrefs,
): Promise<void> {
  cacheService.setMemory(CACHE_NAMESPACE, CACHE_KEY, prefs);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}
