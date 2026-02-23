import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface NavigationCancelButtonProps {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly onPress: () => void;
  readonly variant?: "default" | "danger";
  readonly size?: number;
  readonly testId?: string;
}

export default function NavigationCancelButton({
  icon,
  onPress,
  variant = "default",
  size = 54,
  testId,
}: NavigationCancelButtonProps) {
  const isDanger = variant === "danger";
  const buttonStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: isDanger ? "#ef2a2a" : "#ffffff",
    borderColor: "#800020",
    borderWidth: 1.5,
  };

  return (
    <Pressable
      testID={testId}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        buttonStyle,
        pressed && styles.buttonPressed,
      ]}
    >
      <Ionicons
        name={icon}
        size={isDanger ? 30 : 22}
        color={isDanger ? "#ffffff" : "#800020"}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
});
