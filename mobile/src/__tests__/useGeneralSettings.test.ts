import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook } from "@testing-library/react-native";
import {
  getCampusLabel,
  getLanguageLabel,
  useGeneralSettings,
  useGeneralSettingsStore,
} from "../hooks/useGeneralSettings";

describe("useGeneralSettings", () => {
  describe("getLanguageLabel", () => {
    it("returns English for en", () => {
      expect(getLanguageLabel("en")).toBe("English (US)");
    });
    it("returns French for fr", () => {
      expect(getLanguageLabel("fr")).toBe("Français (CA)");
    });
  });

  describe("getCampusLabel", () => {
    it("returns SGW label", () => {
      expect(getCampusLabel("SGW")).toContain("George");
    });
    it("returns Loyola label", () => {
      expect(getCampusLabel("LOYOLA")).toContain("Loyola");
    });
  });

  describe("useGeneralSettingsStore", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      useGeneralSettingsStore.setState({
        language: "en",
        defaultCampus: "SGW",
      });
    });

    it("setDefaultCampus updates campus", () => {
      useGeneralSettingsStore.getState().setDefaultCampus("LOYOLA");
      expect(useGeneralSettingsStore.getState().defaultCampus).toBe("LOYOLA");
    });

    it("setLanguage updates language", () => {
      useGeneralSettingsStore.getState().setLanguage("fr");
      expect(useGeneralSettingsStore.getState().language).toBe("fr");
    });

    it("hydrateFromStorage merges JSON", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ defaultCampus: "LOYOLA", language: "fr" }),
      );
      await useGeneralSettingsStore.getState().hydrateFromStorage();
      const s = useGeneralSettingsStore.getState();
      expect(s.defaultCampus).toBe("LOYOLA");
      expect(s.language).toBe("fr");
    });

    it("hydrateFromStorage ignores bad JSON", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("!!!");
      await useGeneralSettingsStore.getState().hydrateFromStorage();
      expect(useGeneralSettingsStore.getState().defaultCampus).toBe("SGW");
    });

    it("useGeneralSettings hook returns store slice", () => {
      const { result } = renderHook(() => useGeneralSettings());
      expect(result.current.language).toBe("en");
      expect(typeof result.current.setLanguage).toBe("function");
    });
  });
});
