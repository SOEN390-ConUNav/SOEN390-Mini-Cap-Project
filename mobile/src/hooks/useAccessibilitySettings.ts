import { useMemo } from "react";
import { create } from "zustand";
import {
  getCachedAccessibilityPrefs,
  setCachedAccessibilityPrefs,
} from "../services/accessibilitySettingsCache";

export type FontSizeOption = "small" | "medium" | "large";
export type FontWeightOption = "light" | "regular" | "bold";

/** Shared option lists (avoids duplicated `as const` assertions in UI). */
export const FONT_SIZE_OPTIONS: FontSizeOption[] = ["small", "medium", "large"];
export const FONT_WEIGHT_OPTIONS: FontWeightOption[] = [
  "light",
  "regular",
  "bold",
];

interface AccessibilitySettingsState {
  colorBlindMode: boolean;
  wheelchairUser: boolean;
  fontSize: FontSizeOption;
  fontWeight: FontWeightOption;
  toggleColorBlindMode: () => void;
  toggleWheelchairUser: () => void;
  setFontSize: (value: FontSizeOption) => void;
  setFontWeight: (value: FontWeightOption) => void;
  hydrateFromStorage: () => Promise<void>;
}

export const useAccessibilitySettingsStore = create<AccessibilitySettingsState>(
  (set, get) => ({
    colorBlindMode: false,
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
  const { colorBlindMode, wheelchairUser, fontSize, fontWeight } = state;
  await setCachedAccessibilityPrefs({
    colorBlindMode,
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

/**
 * Scaled text style for dynamic type (font size + weight from accessibility settings).
 */
export function useAccessibleTypography() {
  const { fontSize, fontWeight } = useAccessibilitySettings();
  const fontScale = getFontScale(fontSize);
  const weightValue = getFontWeightValue(fontWeight);
  const textStyle = useMemo(
    () => (baseSize: number) => ({
      fontSize: Math.round(baseSize * fontScale),
      fontWeight: weightValue,
    }),
    [fontScale, weightValue],
  );
  return { fontScale, weightValue, textStyle };
}
