import AsyncStorage from "@react-native-async-storage/async-storage";
import { renderHook } from "@testing-library/react-native";
import {
  getBrightnessLabel,
  useDisplaySettings,
  useDisplaySettingsStore,
} from "../hooks/useDisplaySettings";

describe("useDisplaySettings", () => {
  describe("getBrightnessLabel", () => {
    it("returns Low for low values", () => {
      expect(getBrightnessLabel(0)).toBe("Low");
      expect(getBrightnessLabel(33)).toBe("Low");
    });
    it("returns High for high values", () => {
      expect(getBrightnessLabel(75)).toBe("High");
      expect(getBrightnessLabel(100)).toBe("High");
    });
    it("returns Medium between", () => {
      expect(getBrightnessLabel(50)).toBe("Medium");
    });
  });

  describe("useDisplaySettingsStore", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      useDisplaySettingsStore.setState({
        brightness: 75,
        autoBrightness: true,
        darkMode: false,
        colorIntensity: 100,
        screenTimeout: "2m",
        displayZoom: "Standard",
      });
    });

    it("setDarkMode, setBrightness, setAutoBrightness, setColorIntensity", () => {
      useDisplaySettingsStore.getState().setDarkMode(true);
      useDisplaySettingsStore.getState().setBrightness(40);
      useDisplaySettingsStore.getState().setAutoBrightness(false);
      useDisplaySettingsStore.getState().setColorIntensity(50);
      const s = useDisplaySettingsStore.getState();
      expect(s.darkMode).toBe(true);
      expect(s.brightness).toBe(40);
      expect(s.autoBrightness).toBe(false);
      expect(s.colorIntensity).toBe(50);
    });

    it("setScreenTimeout and setDisplayZoom", () => {
      useDisplaySettingsStore.getState().setScreenTimeout("30s");
      useDisplaySettingsStore.getState().setDisplayZoom("Large");
      const s = useDisplaySettingsStore.getState();
      expect(s.screenTimeout).toBe("30s");
      expect(s.displayZoom).toBe("Large");
    });

    it("hydrateFromStorage merges JSON", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(
        JSON.stringify({ darkMode: true, brightness: 50 }),
      );
      await useDisplaySettingsStore.getState().hydrateFromStorage();
      const s = useDisplaySettingsStore.getState();
      expect(s.darkMode).toBe(true);
      expect(s.brightness).toBe(50);
    });

    it("hydrateFromStorage ignores parse errors", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce("x");
      await useDisplaySettingsStore.getState().hydrateFromStorage();
      expect(useDisplaySettingsStore.getState().darkMode).toBe(false);
    });

    it("useDisplaySettings hook returns store slice", () => {
      const { result } = renderHook(() => useDisplaySettings());
      expect(result.current.brightness).toBe(75);
      expect(typeof result.current.setBrightness).toBe("function");
    });
  });
});
