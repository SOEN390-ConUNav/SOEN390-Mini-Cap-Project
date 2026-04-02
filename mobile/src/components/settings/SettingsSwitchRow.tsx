import React from "react";
import {
  StyleSheet,
  Switch,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { useSettingsSwitchTrackColor } from "./useSettingsSwitchColors";

export type SettingsSwitchRowProps = {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  /**
   * When true, title and switch share one row; subtitle renders below (Display, Notifications).
   * When false, title and subtitle stack on the left with the switch on the right (Navigation).
   */
  subtitleBelow?: boolean;
  /** Tighter vertical padding for stacked rows inside one card (e.g. Notifications). */
  compact?: boolean;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
};

export function SettingsSwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  subtitleBelow = false,
  compact = false,
  titleStyle,
  subtitleStyle,
}: Readonly<SettingsSwitchRowProps>) {
  const { colors } = useTheme();
  const trackColor = useSettingsSwitchTrackColor();

  if (subtitleBelow) {
    return (
      <View>
        <View style={styles.rowHeader}>
          <Text style={[styles.rowTitle, { color: colors.text }, titleStyle]}>
            {title}
          </Text>
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={trackColor}
          />
        </View>
        {subtitle ? (
          <Text
            style={[
              styles.rowSubtitle,
              { color: colors.textMuted },
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.inlineRow, compact ? styles.inlineRowCompact : null]}>
      <View style={styles.inlineTextCol}>
        <Text style={[styles.rowTitle, { color: colors.text }, titleStyle]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.rowSubtitle,
              { color: colors.textMuted },
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={trackColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
  },
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    gap: 10,
  },
  inlineRowCompact: {
    paddingVertical: 0,
  },
  inlineTextCol: {
    flex: 1,
    paddingRight: 8,
  },
});
