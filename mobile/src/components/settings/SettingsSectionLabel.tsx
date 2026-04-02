import React from "react";
import { Text, type StyleProp, type TextStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { settingsSharedStyles } from "./settingsSharedStyles";

export type SettingsSectionLabelProps = {
  children: string;
  style?: StyleProp<TextStyle>;
};

export function SettingsSectionLabel({
  children,
  style,
}: Readonly<SettingsSectionLabelProps>) {
  const { colors } = useTheme();
  return (
    <Text
      style={[
        settingsSharedStyles.sectionLabel,
        { color: colors.textMuted },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
