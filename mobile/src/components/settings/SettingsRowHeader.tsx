import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

export type SettingsRowHeaderProps = {
  title: string;
  valueLabel: string;
  titleStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
};

/** Title on the left, emphasized value on the right (e.g. brightness %). */
export function SettingsRowHeader({
  title,
  valueLabel,
  titleStyle,
  valueStyle,
}: Readonly<SettingsRowHeaderProps>) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }, titleStyle]}>
        {title}
      </Text>
      <Text style={[styles.value, { color: colors.primary }, valueStyle]}>
        {valueLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
  },
  value: {
    fontSize: 14,
    fontWeight: "600",
  },
});
