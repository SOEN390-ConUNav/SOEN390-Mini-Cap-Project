import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  useGeneralSettings,
  getCampusLabel,
} from "../../hooks/useGeneralSettings";
import { useTheme } from "../../hooks/useTheme";

export default function SettingsGeneral() {
  const router = useRouter();
  const { colors } = useTheme();

  const { defaultCampus, setDefaultCampus, hydrateFromStorage } =
    useGeneralSettings();

  useEffect(() => {
    void hydrateFromStorage();
  }, [hydrateFromStorage]);

  const [cacheSize, setCacheSize] = useState("42.3 MB");
  const [offlineMapsSize, setOfflineMapsSize] = useState("128.7 MB");

  const onClearCache = () => {
    // In a real app this would trigger an async clear of on-disk caches.
    setCacheSize("0 MB");
    setOfflineMapsSize("0 MB");
    Alert.alert(
      "Cache cleared",
      "Stored map data and cache have been cleared.",
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="chevron-back" size={24} color={colors.primary} />
        <Text style={[styles.backLabel, { color: colors.primary }]}>
          Settings
        </Text>
      </Pressable>

      <Text style={[styles.title, { color: colors.text }]}>General</Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={[styles.rowCard, { backgroundColor: colors.card }]}
          onPress={() => {
            Alert.alert("Default Campus", "Choose your default campus", [
              {
                text: "Sir George Williams Campus",
                onPress: () => setDefaultCampus("SGW"),
              },
              {
                text: "Loyola Campus",
                onPress: () => setDefaultCampus("LOYOLA"),
              },
              { text: "Cancel", style: "cancel" },
            ]);
          }}
        >
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Default Campus
            </Text>
            <Text style={[styles.rowSubtitle, { color: colors.textMuted }]}>
              {getCampusLabel(defaultCampus)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Storage
          </Text>
          <View style={styles.storageRow}>
            <Text style={[styles.storageLabel, { color: colors.textMuted }]}>
              Cache Size
            </Text>
            <Text style={[styles.storageValue, { color: colors.text }]}>
              {cacheSize}
            </Text>
          </View>
          <View style={styles.storageRow}>
            <Text style={[styles.storageLabel, { color: colors.textMuted }]}>
              Offline Maps
            </Text>
            <Text style={[styles.storageValue, { color: colors.text }]}>
              {offlineMapsSize}
            </Text>
          </View>

          <Pressable
            style={[styles.clearButton, { backgroundColor: colors.primary }]}
            onPress={onClearCache}
          >
            <Text style={styles.clearButtonText}>Clear Cache</Text>
          </Pressable>
        </View>
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  backLabel: { fontSize: 17, marginLeft: 4 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 12 },
  rowCard: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  storageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  storageLabel: {
    fontSize: 14,
  },
  storageValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  clearButton: {
    marginTop: 18,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: "center",
  },
  clearButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
