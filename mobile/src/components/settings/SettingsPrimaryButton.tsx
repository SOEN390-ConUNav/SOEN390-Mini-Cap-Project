import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export type SettingsPrimaryButtonProps = {
  label: string;
  onPress: () => void;
};

export function SettingsPrimaryButton({
  label,
  onPress,
}: Readonly<SettingsPrimaryButtonProps>) {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.button, { backgroundColor: colors.primary }]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
