import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BURGUNDY = "#800020";

interface CircleIconButtonProps {
  readonly onPress?: () => void;
  readonly icon: keyof typeof Ionicons.glyphMap;
  /** Icon size (default 20). Circle diameter = size + 14 */
  readonly size?: number;
  readonly iconColor?: string;
  readonly backgroundColor?: string;
  readonly style?: ViewStyle;
  readonly hitSlop?: number;
}

export default function CircleIconButton({
  onPress,
  icon,
  size = 20,
  iconColor = BURGUNDY,
  backgroundColor = "rgba(128,0,32,0.10)",
  style,
  hitSlop = 8,
}: CircleIconButtonProps) {
  const diameter = size + 14;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [
        styles.circle,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor,
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: "center",
    justifyContent: "center",
  },
});
