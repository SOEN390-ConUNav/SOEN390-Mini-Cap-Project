import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import BottomNav from "../components/BottomNav";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useTheme } from "../hooks/useTheme";
import { useDisplaySettingsStore } from "../hooks/useDisplaySettings";
import { useAccessibilitySettingsStore } from "../hooks/useAccessibilitySettings";

function ThemedRoot() {
  const { colors } = useTheme();
  const { brightness, hydrateFromStorage: hydrateDisplay } = useDisplaySettingsStore();

  useEffect(() => {
    void hydrateDisplay();
    void useAccessibilitySettingsStore.getState().hydrateFromStorage();
  }, [hydrateDisplay]);

  const dimOpacity = brightness < 100 ? ((100 - brightness) / 100) * 0.5 : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <BottomNav />
      {dimOpacity > 0 && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: dimOpacity }]}
        />
      )}
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <ThemedRoot />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}