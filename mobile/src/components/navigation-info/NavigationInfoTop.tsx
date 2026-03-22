import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

interface NavigationInfoTopProps {
  readonly destination: string;
}

const NavigationInfoTop = ({ destination }: NavigationInfoTopProps) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.primary },
      ]}
    >
      <MaterialIcons name="place" size={18} color={colors.text} />

      <Text style={[styles.text, { color: colors.text }]}>{destination}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    elevation: 3,
  },
  text: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default NavigationInfoTop;
