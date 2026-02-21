import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RouteCard from "./RouteCard";
import NavigationBar from "../navigation-bar/NavigationBar";

interface SearchBarProps {
  readonly placeholder: string;
  readonly onPress: () => void;
  readonly isConfiguring?: boolean;
  readonly isNavigating?: boolean;
  readonly originLabel?: string;
  readonly destinationLabel?: string;
  readonly onBack?: () => void;
  readonly onSwap?: () => void;
  readonly navigationInfoToggleState?: "maximize" | "minimize";
}

export default function SearchBar({
  placeholder,
  onPress,
  isConfiguring = false,
  isNavigating = false,
  originLabel = "Current Location",
  destinationLabel = "Select destination",
  onBack,
  onSwap,
  navigationInfoToggleState,
}: SearchBarProps) {
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

  if (isNavigating) {
    return (
      <NavigationBar
        destination={destinationLabel}
        onPress={onBack}
        navigationInfoToggleState={navigationInfoToggleState}
      />
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.85 }]}
    >
      <Ionicons name="search" size={18} color="#555" />
      <Text style={styles.text}>{placeholder}</Text>
      <View style={styles.spacer} />
      <Ionicons name="mic" size={18} color="#555" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
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
    opacity: 0.65,
    fontSize: 15,
  },
  spacer: {
    flex: 1,
  },
});
