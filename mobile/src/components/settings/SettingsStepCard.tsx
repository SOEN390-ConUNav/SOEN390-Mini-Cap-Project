import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { SettingsCard } from "./SettingsCard";
import { SettingsIconCircle } from "./SettingsIconCircle";

export type SettingsStepCardProps = {
  stepLabel: string;
  title: string;
  icon: ComponentProps<typeof Ionicons>["name"];
  children: React.ReactNode;
};

/**
 * Tutorial-style step: icon + step label + title, then body (composite of Card + header + content).
 */
export function SettingsStepCard({
  stepLabel,
  title,
  icon,
  children,
}: Readonly<SettingsStepCardProps>) {
  const { colors } = useTheme();
  return (
    <SettingsCard marginBottom={14}>
      <View style={styles.headerRow}>
        <SettingsIconCircle name={icon} />
        <View style={styles.headerText}>
          <Text style={[styles.stepLabel, { color: colors.textMuted }]}>
            {stepLabel}
          </Text>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            {title}
          </Text>
        </View>
      </View>
      {children}
    </SettingsCard>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  headerText: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
});
