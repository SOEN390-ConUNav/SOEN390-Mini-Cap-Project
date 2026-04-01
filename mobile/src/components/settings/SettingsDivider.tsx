import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export function SettingsDivider() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        marginVertical: 10,
      }}
    />
  );
}
