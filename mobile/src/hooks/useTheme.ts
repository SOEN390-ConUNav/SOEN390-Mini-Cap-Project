import { useEffect } from "react";
import { useDisplaySettings } from "./useDisplaySettings";
import { type ThemeColors, LIGHT_THEME, DARK_THEME } from "../theme/theme";

export function useTheme(): { isDark: boolean; colors: ThemeColors } {
  const { darkMode, hydrateFromStorage } = useDisplaySettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const isDark = darkMode;
  const colors: ThemeColors = isDark ? DARK_THEME : LIGHT_THEME;
  return { isDark, colors };
}
