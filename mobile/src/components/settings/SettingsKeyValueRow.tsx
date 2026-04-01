import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export type SettingsKeyValueRowProps = {
  label: string;
  value: string;
};

export function SettingsKeyValueRow({
  label,
  value,
}: Readonly<SettingsKeyValueRowProps>) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
});
