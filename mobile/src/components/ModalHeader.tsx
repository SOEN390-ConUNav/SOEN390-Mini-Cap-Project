import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";

interface ModalHeaderProps {
  readonly title: string;
  readonly onClose: () => void;
  readonly closeVariant?: "icon" | "text";
  readonly style?: ViewStyle;
  readonly closeTestID?: string;
}

export default function ModalHeader({
  title,
  onClose,
  closeVariant = "icon",
  style,
  closeTestID,
}: ModalHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
      <Pressable onPress={onClose} style={styles.closeBtn} testID={closeTestID}>
        {closeVariant === "text" ? (
          <Text style={[styles.closeText, { color: colors.primary }]}>
            Close
          </Text>
        ) : (
          <Ionicons name="close" size={24} color={colors.primary} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
  },
  closeText: {
    fontWeight: "600",
  },
});
