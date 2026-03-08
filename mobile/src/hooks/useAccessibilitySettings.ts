import { create } from "zustand";
import {
  getCachedAccessibilityPrefs,
  setCachedAccessibilityPrefs,
} from "../services/accessibilitySettingsCache";

type FontSizeOption = "small" | "medium" | "large";
type FontWeightOption = "light" | "regular" | "bold";

interface AccessibilitySettingsState {
  colorBlindMode: boolean;
  highContrastMode: boolean;
  reduceMotion: boolean;
  wheelchairUser: boolean;
  fontSize: FontSizeOption;
  fontWeight: FontWeightOption;
  toggleColorBlindMode: () => void;
  toggleHighContrastMode: () => void;
  toggleReduceMotion: () => void;
  toggleWheelchairUser: () => void;
  setFontSize: (value: FontSizeOption) => void;
  setFontWeight: (value: FontWeightOption) => void;
  hydrateFromStorage: () => Promise<void>;
}

export const useAccessibilitySettingsStore = create<AccessibilitySettingsState>(
  (set, get) => ({
    colorBlindMode: false,
    highContrastMode: false,
    reduceMotion: false,
    wheelchairUser: false,
    fontSize: "medium",
    fontWeight: "regular",
    toggleColorBlindMode: () => {
      set((state) => {
        const next = { ...state, colorBlindMode: !state.colorBlindMode };
        void persist(next);
        return next;
      });
    },
    toggleHighContrastMode: () => {
      set((state) => {
        const next = { ...state, highContrastMode: !state.highContrastMode };
        void persist(next);
        return next;
      });
    },
    toggleReduceMotion: () => {
      set((state) => {
        const next = { ...state, reduceMotion: !state.reduceMotion };
        void persist(next);
        return next;
      });
    },
    toggleWheelchairUser: () => {
      set((state) => {
        const next = { ...state, wheelchairUser: !state.wheelchairUser };
        void persist(next);
        return next;
      });
    },
    setFontSize: (fontSize) => {
      set((state) => {
        const next = { ...state, fontSize };
        void persist(next);
        return next;
      });
    },
    setFontWeight: (fontWeight) => {
      set((state) => {
        const next = { ...state, fontWeight };
        void persist(next);
        return next;
      });
    },
    hydrateFromStorage: async () => {
      try {
        const cached = await getCachedAccessibilityPrefs();
        if (!cached) return;
        set((state) => ({
          ...state,
          ...cached,
        }));
      } catch {}
    },
  }),
);

async function persist(state: AccessibilitySettingsState) {
  const {
    colorBlindMode,
    highContrastMode,
    reduceMotion,
    wheelchairUser,
    fontSize,
    fontWeight,
  } = state;
  await setCachedAccessibilityPrefs({
    colorBlindMode,
    highContrastMode,
    reduceMotion,
    wheelchairUser,
    fontSize,
    fontWeight,
  });
}

export function useAccessibilitySettings() {
  return useAccessibilitySettingsStore();
}

export function getFontSizeLabel(size: FontSizeOption) {
  if (size === "small") return "Small";
  if (size === "large") return "Large";
  return "Medium";
}

export function getFontWeightLabel(weight: FontWeightOption) {
  if (weight === "light") return "Light";
  if (weight === "bold") return "Bold";
  return "Regular";
}

export function getFontScale(size: FontSizeOption): number {
  switch (size) {
    case "small":
      return 0.875;
    case "large":
      return 1.25;
    case "medium":
    default:
      return 1;
  }
}

export function getFontWeightValue(
  weight: FontWeightOption,
): "400" | "500" | "700" {
  switch (weight) {
    case "light":
      return "400";
    case "bold":
      return "700";
    case "regular":
    default:
      return "500";
  }
}
