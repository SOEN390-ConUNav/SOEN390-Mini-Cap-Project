import React from "react";
import { StyleSheet, Text, type StyleProp, type TextStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

const styles = StyleSheet.create({
  lastUpdated: {
    fontSize: 13,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
  },
});

export function SettingsLegalLastUpdated({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>
      {children}
    </Text>
  );
}

export function SettingsLegalSectionTitle({
  children,
  style,
}: {
  children: string;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.sectionTitle, { color: colors.text }, style]}>
      {children}
    </Text>
  );
}

export function SettingsLegalParagraph({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.paragraph, { color: colors.textMuted }, style]}>
      {children}
    </Text>
  );
}

export function SettingsLegalBullet({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.bullet, { color: colors.textMuted }, style]}>
      {children}
    </Text>
  );
}
