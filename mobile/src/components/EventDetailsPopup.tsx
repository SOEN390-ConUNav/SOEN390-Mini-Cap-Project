import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import PopupTemplate from "./PopupTemplate";
import { useTheme } from "../hooks/useTheme";

export default function EventDetailsPopup({
  visible,
  title,
  detailsText,
  showDirections = true,
  accessibility,
  onClose,
  onDirections,
  onChangeCalendar,
  onLogout,
}: Readonly<{
  visible: boolean;
  title: string;
  detailsText: string;
  showDirections?: boolean;
  accessibility?: {
    hasElevator: boolean;
    hasParking: boolean;
    isAccessible: boolean;
  };
  onClose: () => void;
  onDirections: () => void;
  onChangeCalendar: () => void;
  onLogout: () => void;
}>) {
  const { colors } = useTheme();
  if (!visible) return null;
  return (
    <PopupTemplate
      title={title}
      accessibility={accessibility}
      onClose={onClose}
      dismissOnBackdropPress
      renderBody={() => (
        <Text style={[styles.body, { color: colors.text }]}>{detailsText}</Text>
      )}
      renderButtons={() => (
        <>
          <View style={styles.buttonRow}>
            <Pressable
              style={[
                styles.actionBtn,
                styles.changeCalendarBtn,
                {
                  backgroundColor: `${colors.primary}14`,
                  borderColor: colors.primary,
                },
              ]}
              onPress={onChangeCalendar}
            >
              <Text
                style={[
                  styles.changeCalendarBtnText,
                  { color: colors.primary },
                ]}
              >
                Change calendar
              </Text>
            </Pressable>
            {showDirections ? (
              <Pressable
                onPress={onDirections}
                style={[
                  styles.directionsBtn,
                  { backgroundColor: colors.primary },
                ]}
              >
                <FontAwesome5 name="directions" size={18} color="white" />
                <Text style={styles.directionsText}>Directions</Text>
              </Pressable>
            ) : null}
          </View>
          <View style={{ height: 8 }} />
          <Pressable
            style={[styles.logoutBtn, { backgroundColor: colors.primary }]}
            onPress={onLogout}
          >
            <Text style={styles.logoutBtnText}>Log out of Google</Text>
          </Pressable>
        </>
      )}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
  },
  buttonRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  directionsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  directionsText: {
    color: "#fff",
    fontWeight: "800",
  },
  changeCalendarBtn: {
    borderWidth: 1,
  },
  changeCalendarBtnText: {
    fontWeight: "700",
  },
  logoutBtn: {
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "white",
    fontWeight: "700",
  },
});
