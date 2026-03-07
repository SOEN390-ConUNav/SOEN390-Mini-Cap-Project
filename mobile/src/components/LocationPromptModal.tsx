import React from "react";
import { Modal, StyleSheet, Text, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Building } from "../data/buildings";

const BURGUNDY = "#800020";

interface LocationPromptModalProps {
  visible: boolean;
  building: Building;
  onSelectInside: () => void;
  onSelectOutside: () => void;
  onClose: () => void;
}

export default function LocationPromptModal({
  visible,
  building,
  onSelectInside,
  onSelectOutside,
  onClose,
}: Readonly<LocationPromptModalProps>) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </Pressable>

          <View style={styles.iconContainer}>
            <Ionicons name="location" size={32} color={BURGUNDY} />
          </View>

          <Text style={styles.title}>Where are you?</Text>
          <Text style={styles.subtitle}>
            You're near <Text style={styles.buildingName}>{building.name}</Text>
            . Are you inside or outside the building?
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={[styles.button, styles.insideButton]}
              onPress={onSelectInside}
            >
              <Ionicons name="business" size={20} color="#fff" />
              <Text style={styles.buttonText}>Inside Building</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.outsideButton]}
              onPress={onSelectOutside}
            >
              <Ionicons name="walk" size={20} color={BURGUNDY} />
              <Text style={[styles.buttonText, styles.outsideButtonText]}>
                Outside
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    padding: 4,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(128, 0, 32, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  buildingName: {
    fontWeight: "600",
    color: "#333",
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  insideButton: {
    backgroundColor: BURGUNDY,
  },
  outsideButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: BURGUNDY,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  outsideButtonText: {
    color: BURGUNDY,
  },
});
