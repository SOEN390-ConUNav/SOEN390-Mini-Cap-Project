import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface DisplaySettingsState {
  brightness: number; // 0-100
  autoBrightness: boolean;
  darkMode: boolean;
  colorIntensity: number; // 0-100
  screenTimeout: "30s" | "1m" | "2m";
  displayZoom: "Standard" | "Large";
  setBrightness: (value: number) => void;
  setAutoBrightness: (value: boolean) => void;
  setDarkMode: (value: boolean) => void;
  setColorIntensity: (value: number) => void;
  setScreenTimeout: (value: "30s" | "1m" | "2m") => void;
  setDisplayZoom: (value: "Standard" | "Large") => void;
  hydrateFromStorage: () => Promise<void>;
}

const STORAGE_KEY = "displaySettings.v1";

export const useDisplaySettingsStore = create<DisplaySettingsState>(
  (set, get) => ({
    brightness: 75,
    autoBrightness: true,
    darkMode: false,
    colorIntensity: 100,
    screenTimeout: "2m",
    displayZoom: "Standard",
    setBrightness: (brightness) =>
      set((state) => {
        const next = { ...state, brightness };
        void persist(next);
        return next;
      }),
    setAutoBrightness: (autoBrightness) =>
      set((state) => {
        const next = { ...state, autoBrightness };
        void persist(next);
        return next;
      }),
    setDarkMode: (darkMode) =>
      set((state) => {
        const next = { ...state, darkMode };
        void persist(next);
        return next;
      }),
    setColorIntensity: (colorIntensity) =>
      set((state) => {
        const next = { ...state, colorIntensity };
        void persist(next);
        return next;
      }),
    setScreenTimeout: (screenTimeout) =>
      set((state) => {
        const next = { ...state, screenTimeout };
        void persist(next);
        return next;
      }),
    setDisplayZoom: (displayZoom) =>
      set((state) => {
        const next = { ...state, displayZoom };
        void persist(next);
        return next;
      }),
    hydrateFromStorage: async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        set((state) => ({
          ...state,
          ...parsed,
        }));
      } catch {
        // ignore hydration issues
      }
    },
  }),
);

async function persist(state: DisplaySettingsState) {
  const {
    brightness,
    autoBrightness,
    darkMode,
    colorIntensity,
    screenTimeout,
    displayZoom,
  } = state;
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        brightness,
        autoBrightness,
        darkMode,
        colorIntensity,
        screenTimeout,
        displayZoom,
      }),
    );
  } catch {
    // best-effort
  }
}

export function useDisplaySettings() {
  return useDisplaySettingsStore();
}

export function getBrightnessLabel(value: number): string {
  if (value <= 33) return "Low";
  if (value >= 75) return "High";
  return "Medium";
}

