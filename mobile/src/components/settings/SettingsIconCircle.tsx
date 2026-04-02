import React from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTheme } from "../../hooks/useTheme";

export type SettingsIconCircleProps = {
  name: ComponentProps<typeof Ionicons>["name"];
  size?: number;
};

export function SettingsIconCircle({
  name,
  size = 20,
}: Readonly<SettingsIconCircleProps>) {
  const { colors } = useTheme();
  return (
    <View style={[styles.circle, { backgroundColor: colors.primary }]}>
      <Ionicons name={name} size={size} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
});
