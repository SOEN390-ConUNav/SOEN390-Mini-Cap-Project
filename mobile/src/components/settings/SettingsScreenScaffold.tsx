import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

export type SettingsScreenScaffoldProps = {
  title: string;
  backLabel?: string;
  children: React.ReactNode;
  backLabelStyle?: StyleProp<TextStyle>;
  titleStyle?: StyleProp<TextStyle>;
};

export function SettingsScreenScaffold({
  title,
  backLabel = "Settings",
  children,
  backLabelStyle,
  titleStyle,
}: SettingsScreenScaffoldProps) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text
          style={[styles.backLabel, { color: colors.primary }, backLabelStyle]}
        >
          {backLabel}
        </Text>
      </Pressable>
      <Text style={[styles.title, { color: colors.text }, titleStyle]}>
        {title}
      </Text>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 20,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  backRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  backLabel: { fontSize: 17, marginLeft: 4 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
});
