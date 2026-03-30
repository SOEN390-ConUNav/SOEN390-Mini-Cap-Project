import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ModalHeader from "./ModalHeader";

interface FloorSelectorProps {
  currentFloor: string;
  availableFloors: string[];
  onFloorSelect: (floor: string) => void;
  buildingName?: string;
}

export default function FloorSelector({
  currentFloor,
  availableFloors,
  onFloorSelect,
  buildingName,
}: Readonly<FloorSelectorProps>) {
  const [isVisible, setIsVisible] = React.useState(false);

  if (availableFloors.length <= 1) {
    return null; // Don't show selector if only one floor
  }

  return (
    <>
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setIsVisible(true)}
        activeOpacity={0.7}
      >
        <Ionicons name="layers" size={18} color="#8B1538" />
        <Text style={styles.selectorText}>Floor {currentFloor}</Text>
        <Ionicons name="chevron-down" size={16} color="#8B1538" />
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsVisible(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <ModalHeader
              title={`${buildingName || "Building"} - Select Floor`}
              onClose={() => setIsVisible(false)}
              style={styles.modalHeader}
            />

            <View style={styles.floorsList}>
              {availableFloors.map((floor) => (
                <TouchableOpacity
                  key={floor}
                  style={[
                    styles.floorItem,
                    currentFloor === floor && styles.floorItemSelected,
                  ]}
                  onPress={() => {
                    onFloorSelect(floor);
                    setIsVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.floorItemText,
                      currentFloor === floor && styles.floorItemTextSelected,
                    ]}
                  >
                    Floor {floor}
                  </Text>
                  {currentFloor === floor && (
                    <Ionicons name="checkmark" size={20} color="#8B1538" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  selectorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    gap: 6,
  },
  selectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B1538",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  floorsList: {
    padding: 8,
  },
  floorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 4,
  },
  floorItemSelected: {
    backgroundColor: "#F5E6EA",
  },
  floorItemText: {
    fontSize: 16,
    color: "#424242",
    fontWeight: "500",
  },
  floorItemTextSelected: {
    color: "#8B1538",
    fontWeight: "600",
  },
});
