import React from "react";
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";

export type SettingsLabeledValueRowProps = {
  title: string;
  subtitle?: string;
  valueLabel: string;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
};

/** Header row with title/subtitle on the left and a value label on the right (no switch). */
export function SettingsLabeledValueRow({
  title,
  subtitle,
  valueLabel,
  titleStyle,
  subtitleStyle,
  valueStyle,
}: Readonly<SettingsLabeledValueRowProps>) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        <Text style={[styles.title, { color: colors.text }, titleStyle]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: colors.textMuted },
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
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
  textCol: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
  },
  value: {
    fontSize: 14,
    fontWeight: "500",
  },
});
