import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

const BURGUNDY = "#800020";

export default function EventDetailsPopup({
  visible,
  title,
  detailsText,
  showDirections = true,
  onClose,
  onDirections,
  onChangeCalendar,
  onLogout,
}: {
  visible: boolean;
  title: string;
  detailsText: string;
  showDirections?: boolean;
  onClose: () => void;
  onDirections: () => void;
  onChangeCalendar: () => void;
  onLogout: () => void;
}) {
  if (!visible) return null;

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#111" />
          </Pressable>
        </View>

        <Text style={styles.body}>{detailsText}</Text>

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.actionBtn, styles.changeCalendarBtn]}
            onPress={onChangeCalendar}
          >
            <Text style={styles.changeCalendarBtnText}>Change calendar</Text>
          </Pressable>
          {showDirections ? (
            <Pressable onPress={onDirections} style={styles.directionsBtn}>
              <FontAwesome5 name="directions" size={18} color="white" />
              <Text style={styles.directionsText}>Directions</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={{ height: 8 }} />
        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutBtnText}>Log out of Google</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 6,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: "#333",
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
    backgroundColor: BURGUNDY,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  directionsText: {
    color: "#fff",
    fontWeight: "800",
  },
  changeCalendarBtn: {
    backgroundColor: "rgba(128, 0, 32, 0.08)",
    borderWidth: 1,
    borderColor: BURGUNDY,
  },
  changeCalendarBtnText: {
    color: BURGUNDY,
    fontWeight: "700",
  },
  logoutBtn: {
    backgroundColor: BURGUNDY,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  logoutBtnText: {
    color: "white",
    fontWeight: "700",
  },
});
