import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import RouteCard from "./RouteCard";

interface SearchBarProps {
  placeholder: string;
  onPress: () => void;
  isConfiguring?: boolean;
  isNavigating?: boolean;
  originLabel?: string;
  destinationLabel?: string;
  onBack?: () => void;
  onSwap?: () => void;
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
                                  }: SearchBarProps) {
  if (isConfiguring || isNavigating) {
    return (
        <RouteCard
            originLabel={originLabel}
            destinationLabel={destinationLabel}
            onBack={onBack ?? (() => {})}
            onSwap={onSwap ?? (() => {})}
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