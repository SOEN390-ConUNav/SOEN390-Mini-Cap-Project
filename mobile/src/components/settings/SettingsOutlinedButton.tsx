import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export type SettingsOutlinedButtonProps = {
  label: string;
  onPress: () => void;
};

export function SettingsOutlinedButton({
  label,
  onPress,
}: Readonly<SettingsOutlinedButtonProps>) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.button, { borderColor: colors.border }]}
      onPress={onPress}
    >
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
  },
});
