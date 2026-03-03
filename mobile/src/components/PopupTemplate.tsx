import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Foundation from "@expo/vector-icons/Foundation";

export const BURGUNDY = "#800020";

export interface AccessibilityInfo {
  hasElevator: boolean;
  hasParking: boolean;
  isAccessible: boolean;
}

interface PopupTemplateProps {
  readonly title: string;
  readonly accessibility?: AccessibilityInfo;
  readonly onClose: () => void;
  readonly dismissOnBackdropPress?: boolean;
  readonly renderTopContent?: () => React.ReactNode;
  readonly renderBody: () => React.ReactNode;
  readonly renderButtons: () => React.ReactNode;
}

function AccessibilityIcons({ acc }: { readonly acc: AccessibilityInfo }) {
  if (!acc.hasParking && !acc.hasElevator && !acc.isAccessible) return null;
  return (
    <View style={styles.iconsRow}>
      {acc.hasParking && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>P</Text>
        </View>
      )}
      {acc.hasElevator && (
        <Foundation name="elevator" size={20} color={BURGUNDY} />
      )}
      {acc.isAccessible && (
        <FontAwesome name="wheelchair" size={20} color={BURGUNDY} />
      )}
    </View>
  );
}

const defaultAccessibility: AccessibilityInfo = {
  hasElevator: false,
  hasParking: false,
  isAccessible: false,
};

export default function PopupTemplate({
  title,
  accessibility,
  onClose,
  dismissOnBackdropPress = false,
  renderTopContent,
  renderBody,
  renderButtons,
}: PopupTemplateProps) {
  const acc = accessibility ?? defaultAccessibility;

  const card = (
    <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
      {renderTopContent?.()}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.headerRight}>
            <AccessibilityIcons acc={acc} />
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#111" />
            </Pressable>
          </View>
        </View>
        {renderBody()}
        {renderButtons()}
      </View>
    </Pressable>
  );

  if (dismissOnBackdropPress) {
    return (
      <Pressable style={styles.backdrop} onPress={onClose}>
        {card}
      </Pressable>
    );
  }

  return <View style={styles.backdrop}>{card}</View>;
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  header: {
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
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: BURGUNDY,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: { color: "#fff", fontWeight: "900" },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
