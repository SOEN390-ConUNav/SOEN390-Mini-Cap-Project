/**
 * Central theme colors. Use useTheme() to get the active palette based on dark mode.
 */
export const BURGUNDY = "#800020";
export const BURGUNDY_BORDER = "#a03040";

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryBorder: string;
  tabBarBackground: string;
  iconDefault: string;
}

export const LIGHT_THEME: ThemeColors = {
  background: "#ffffff",
  surface: "#f5f5f5",
  card: "#ffffff",
  text: "#1a1a1a",
  textSecondary: "#2d2d2d",
  textMuted: "#666666",
  border: "#E0E0E0",
  primary: BURGUNDY,
  primaryBorder: BURGUNDY_BORDER,
  tabBarBackground: "rgba(255,255,255,0.98)",
  iconDefault: "#333",
};

export const DARK_THEME: ThemeColors = {
  background: "#121212",
  surface: "#1e1e1e",
  card: "#2d2d2d",
  text: "#f5f5f5",
  textSecondary: "#e0e0e0",
  textMuted: "#b0b0b0",
  border: "#404040",
  primary: "#c04050",
  primaryBorder: "#d05060",
  tabBarBackground: "rgba(30,30,30,0.98)",
  iconDefault: "#e0e0e0",
};
