import { useMemo } from "react";
import { useTheme } from "../../hooks/useTheme";

export function useSettingsSwitchTrackColor() {
  const { colors } = useTheme();
  return useMemo(
    () => ({ false: colors.border, true: colors.primary }),
    [colors.border, colors.primary],
  );
}
