import React, { useRef } from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RouteCard from "./RouteCard";
import NavigationBar from "../navigation-bar/NavigationBar";
import { Step } from "../../api/outdoorDirectionsApi";
import { useTheme } from "../../hooks/useTheme";

interface SearchBarProps {
  readonly placeholder: string;
  readonly onPress: () => void;
  readonly isConfiguring?: boolean;
  readonly isNavigating?: boolean;
  readonly isCancellingNavigation?: boolean;
  readonly originLabel?: string;
  readonly destinationLabel?: string;
  readonly onBack?: () => void;
  readonly onSwap?: () => void;
  readonly navigationInfoToggleState?: "maximize" | "minimize";
  readonly navigationHUDToggleState?: "maximize" | "minimize";
  readonly navigationHUDStep?: Step;
}

export default function SearchBar({
  placeholder,
  onPress,
  isConfiguring = false,
  isNavigating = false,
  isCancellingNavigation = false,
  originLabel = "Current Location",
  destinationLabel = "Select destination",
  onBack,
  onSwap,
  navigationInfoToggleState,
  navigationHUDToggleState,
  navigationHUDStep,
}: SearchBarProps) {
  const { colors } = useTheme();
  const lastPressTsRef = useRef(0);

  const handlePress = () => {
    const now = Date.now();
    if (now - lastPressTsRef.current < 400) return;
    lastPressTsRef.current = now;
    onPress();
  };

  if (isConfiguring) {
    return (
      <RouteCard
        originLabel={originLabel}
        destinationLabel={destinationLabel}
        onBack={onBack ?? (() => {})}
        onSwap={onSwap ?? (() => {})}
      />
    );
  }

  if (isNavigating || isCancellingNavigation) {
    return (
      <NavigationBar
        destination={destinationLabel}
        onPress={onBack}
        navigationInfoToggleState={navigationInfoToggleState}
        navigationHUDToggleState={navigationHUDToggleState}
        isCancellingNavigation={isCancellingNavigation}
        navigationHUDStep={navigationHUDStep}
      />
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        { backgroundColor: colors.card },
        pressed && { opacity: 0.85 },
      ]}
    >
      <Ionicons name="search" size={18} color={colors.iconDefault} />
      <Text style={[styles.text, { color: colors.textMuted }]}>
        {placeholder}
      </Text>
      <View style={styles.spacer} />
      <Ionicons name="mic" size={18} color={colors.iconDefault} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  text: {
    fontSize: 15,
  },
  spacer: {
    flex: 1,
  },
});
