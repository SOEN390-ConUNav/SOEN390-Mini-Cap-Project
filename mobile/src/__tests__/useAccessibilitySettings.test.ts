import { renderHook } from "@testing-library/react-native";
import {
  FONT_SIZE_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  getFontScale,
  getFontWeightValue,
  getFontSizeLabel,
  getFontWeightLabel,
  useAccessibilitySettingsStore,
  useAccessibleTypography,
} from "../hooks/useAccessibilitySettings";

describe("useAccessibilitySettings", () => {
  describe("getFontScale", () => {
    it("returns 0.875 for small", () => {
      expect(getFontScale("small")).toBe(0.875);
    });

    it("returns 1 for medium", () => {
      expect(getFontScale("medium")).toBe(1);
    });

    it("returns 1.25 for large", () => {
      expect(getFontScale("large")).toBe(1.25);
    });
  });

  describe("getFontWeightValue", () => {
    it("returns 400 for light", () => {
      expect(getFontWeightValue("light")).toBe("400");
    });

    it("returns 500 for regular", () => {
      expect(getFontWeightValue("regular")).toBe("500");
    });

    it("returns 700 for bold", () => {
      expect(getFontWeightValue("bold")).toBe("700");
    });
  });

  describe("getFontSizeLabel", () => {
    it("returns Small for small", () => {
      expect(getFontSizeLabel("small")).toBe("Small");
    });

    it("returns Medium for medium", () => {
      expect(getFontSizeLabel("medium")).toBe("Medium");
    });

    it("returns Large for large", () => {
      expect(getFontSizeLabel("large")).toBe("Large");
    });
  });

  describe("getFontWeightLabel", () => {
    it("returns Light for light", () => {
      expect(getFontWeightLabel("light")).toBe("Light");
    });

    it("returns Regular for regular", () => {
      expect(getFontWeightLabel("regular")).toBe("Regular");
    });

    it("returns Bold for bold", () => {
      expect(getFontWeightLabel("bold")).toBe("Bold");
    });
  });

  describe("useAccessibilitySettingsStore", () => {
    beforeEach(() => {
      useAccessibilitySettingsStore.setState({
        colorBlindMode: false,
        wheelchairUser: false,
        fontSize: "medium",
        fontWeight: "regular",
      });
    });

    it("has default state", () => {
      const state = useAccessibilitySettingsStore.getState();
      expect(state.fontSize).toBe("medium");
      expect(state.fontWeight).toBe("regular");
      expect(state.colorBlindMode).toBe(false);
      expect(state.wheelchairUser).toBe(false);
    });

    it("setFontSize updates fontSize", () => {
      useAccessibilitySettingsStore.getState().setFontSize("large");
      expect(useAccessibilitySettingsStore.getState().fontSize).toBe("large");
      useAccessibilitySettingsStore.getState().setFontSize("small");
      expect(useAccessibilitySettingsStore.getState().fontSize).toBe("small");
    });

    it("setFontWeight updates fontWeight", () => {
      useAccessibilitySettingsStore.getState().setFontWeight("bold");
      expect(useAccessibilitySettingsStore.getState().fontWeight).toBe("bold");
      useAccessibilitySettingsStore.getState().setFontWeight("light");
      expect(useAccessibilitySettingsStore.getState().fontWeight).toBe("light");
    });

    it("toggleWheelchairUser toggles wheelchairUser", () => {
      expect(useAccessibilitySettingsStore.getState().wheelchairUser).toBe(
        false,
      );
      useAccessibilitySettingsStore.getState().toggleWheelchairUser();
      expect(useAccessibilitySettingsStore.getState().wheelchairUser).toBe(
        true,
      );
      useAccessibilitySettingsStore.getState().toggleWheelchairUser();
      expect(useAccessibilitySettingsStore.getState().wheelchairUser).toBe(
        false,
      );
    });

    it("toggleColorBlindMode toggles colorBlindMode", () => {
      expect(useAccessibilitySettingsStore.getState().colorBlindMode).toBe(
        false,
      );
      useAccessibilitySettingsStore.getState().toggleColorBlindMode();
      expect(useAccessibilitySettingsStore.getState().colorBlindMode).toBe(
        true,
      );
    });
  });

  describe("FONT_SIZE_OPTIONS and FONT_WEIGHT_OPTIONS", () => {
    it("exhaustive font size keys", () => {
      expect(FONT_SIZE_OPTIONS).toEqual(["small", "medium", "large"]);
    });
    it("exhaustive font weight keys", () => {
      expect(FONT_WEIGHT_OPTIONS).toEqual(["light", "regular", "bold"]);
    });
  });

  describe("useAccessibleTypography", () => {
    beforeEach(() => {
      useAccessibilitySettingsStore.setState({
        fontSize: "medium",
        fontWeight: "regular",
      });
    });

    it("returns scaled textStyle from settings", () => {
      const { result } = renderHook(() => useAccessibleTypography());
      expect(result.current.textStyle(12)).toEqual({
        fontSize: 12,
        fontWeight: "500",
      });
    });
  });
});
