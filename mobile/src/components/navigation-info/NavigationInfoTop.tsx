import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";

interface NavigationInfoTopProps {
  readonly destination: string;
}

const NavigationInfoTop = ({ destination }: NavigationInfoTopProps) => {
  return (
    <View style={styles.container}>
      <MaterialIcons name="place" size={18} color="#000" />

      <Text style={styles.text}>{destination}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#fff",
    borderRadius: 25,

    paddingHorizontal: 14,
    paddingVertical: 8,

    borderWidth: 1,
    borderColor: "#800020",

    elevation: 3,
  },

  text: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
  },
});

export default NavigationInfoTop;
