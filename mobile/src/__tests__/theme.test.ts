import {
  BURGUNDY,
  BURGUNDY_BORDER,
  LIGHT_THEME,
  DARK_THEME,
  type ThemeColors,
} from "../theme/theme";

const THEME_KEYS: (keyof ThemeColors)[] = [
  "background",
  "surface",
  "card",
  "text",
  "textSecondary",
  "textMuted",
  "border",
  "primary",
  "primaryBorder",
  "tabBarBackground",
  "iconDefault",
];

describe("theme", () => {
  describe("constants", () => {
    it("BURGUNDY is #800020", () => {
      expect(BURGUNDY).toBe("#800020");
    });

    it("BURGUNDY_BORDER is #a03040", () => {
      expect(BURGUNDY_BORDER).toBe("#a03040");
    });
  });

  describe("LIGHT_THEME", () => {
    it("has all ThemeColors keys", () => {
      THEME_KEYS.forEach((key) => {
        expect(LIGHT_THEME).toHaveProperty(key);
        expect(typeof LIGHT_THEME[key]).toBe("string");
      });
    });

    it("uses light background and text", () => {
      expect(LIGHT_THEME.background).toBe("#ffffff");
      expect(LIGHT_THEME.card).toBe("#ffffff");
      expect(LIGHT_THEME.text).toBe("#1a1a1a");
      expect(LIGHT_THEME.textMuted).toBe("#666666");
    });

    it("uses BURGUNDY for primary", () => {
      expect(LIGHT_THEME.primary).toBe(BURGUNDY);
      expect(LIGHT_THEME.primaryBorder).toBe(BURGUNDY_BORDER);
    });
  });

  describe("DARK_THEME", () => {
    it("has all ThemeColors keys", () => {
      THEME_KEYS.forEach((key) => {
        expect(DARK_THEME).toHaveProperty(key);
        expect(typeof DARK_THEME[key]).toBe("string");
      });
    });

    it("uses dark background and light text", () => {
      expect(DARK_THEME.background).toBe("#121212");
      expect(DARK_THEME.card).toBe("#2d2d2d");
      expect(DARK_THEME.text).toBe("#f5f5f5");
      expect(DARK_THEME.textMuted).toBe("#b0b0b0");
    });

    it("uses distinct primary (lighter than BURGUNDY for dark mode)", () => {
      expect(DARK_THEME.primary).toBe("#c04050");
      expect(DARK_THEME.primaryBorder).toBe("#d05060");
    });
  });
});
