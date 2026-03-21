import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type LanguageCode = "en" | "fr";
type CampusCode = "SGW" | "LOYOLA";

interface GeneralSettingsState {
  language: LanguageCode;
  defaultCampus: CampusCode;
  setLanguage: (lang: LanguageCode) => void;
  setDefaultCampus: (campus: CampusCode) => void;
  hydrateFromStorage: () => Promise<void>;
}

const STORAGE_KEY = "generalSettings.v1";

export const useGeneralSettingsStore = create<GeneralSettingsState>(
  (set, get) => ({
    language: "en",
    defaultCampus: "SGW",
    setLanguage: (language) => {
      set((state) => {
        const next = { ...state, language };
        void persist(next);
        return next;
      });
    },
    setDefaultCampus: (defaultCampus) => {
      set((state) => {
        const next = { ...state, defaultCampus };
        void persist(next);
        return next;
      });
    },
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
        // ignore hydration errors
      }
    },
  }),
);

async function persist(state: GeneralSettingsState) {
  const { language, defaultCampus } = state;
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ language, defaultCampus }),
    );
  } catch {
    // best-effort persistence
  }
}

export function useGeneralSettings() {
  return useGeneralSettingsStore();
}

export function getLanguageLabel(lang: LanguageCode): string {
  return lang === "fr" ? "Français (CA)" : "English (US)";
}

export function getCampusLabel(campus: CampusCode): string {
  return campus === "LOYOLA"
    ? "Loyola Campus"
    : "Sir George Williams Campus";
}

