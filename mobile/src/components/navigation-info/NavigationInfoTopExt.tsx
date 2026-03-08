import { View, Text, StyleSheet } from "react-native";
import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import useNavigationInfo from "../../hooks/useNavigationInfo";
import { calculateETA } from "../../utils/navigationUtils";
import { useTheme } from "../../hooks/useTheme";

interface NavigationInfoTopExtProps {
  readonly destination: string;
}

const NavigationInfoTopExt = ({ destination }: NavigationInfoTopExtProps) => {
  const { colors } = useTheme();
  const distance = useNavigationInfo((state) => state.pathDistance);
  const duration = useNavigationInfo((state) => state.pathDuration);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={styles.headerRow}>
        <MaterialIcons name="place" size={18} color={colors.text} />
        <Text style={[styles.title, { color: colors.text }]}>{destination}</Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Arriving at</Text>
        <Text style={[styles.value, { color: colors.text }]}>{calculateETA(duration)}</Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={[styles.label, { color: colors.textMuted }]}>Distance</Text>
        <Text style={[styles.value, { color: colors.text }]}>{distance}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    marginLeft: 6,
    fontWeight: "bold",
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 2,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default NavigationInfoTopExt;
