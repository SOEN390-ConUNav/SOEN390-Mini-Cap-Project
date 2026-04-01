import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { settingsSharedStyles } from "./settingsSharedStyles";

export type SettingsCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Override default bottom margin (e.g. 14 for tighter stacks). */
  marginBottom?: number;
};

/**
 * Composite leaf: themed surface card. Compose with row primitives inside.
 */
export function SettingsCard({
  children,
  style,
  marginBottom,
}: Readonly<SettingsCardProps>) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        settingsSharedStyles.card,
        { backgroundColor: colors.card },
        marginBottom !== undefined && { marginBottom },
        style,
      ]}
    >
      {children}
    </View>
  );
}
