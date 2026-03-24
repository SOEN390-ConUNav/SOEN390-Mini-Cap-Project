import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTheme } from "../hooks/useTheme";

interface RoomListModalProps {
  visible: boolean;
  selectingFor: "start" | "end" | null;
  searchQuery: string;
  filteredRooms: string[];
  onSearchChange: (query: string) => void;
  onSelectRoom: (room: string) => void;
  onClose: () => void;
}

function getModalTitle(selectingFor: "start" | "end" | null): string {
  if (selectingFor === "start") return "Select Start Room";
  if (selectingFor === "end") return "Select End Room";
  return "All Rooms";
}

export default function RoomListModal({
  visible,
  selectingFor,
  searchQuery,
  filteredRooms,
  onSearchChange,
  onSelectRoom,
  onClose,
}: Readonly<RoomListModalProps>) {
  const { colors } = useTheme();
  const modalTitle = getModalTitle(selectingFor);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {modalTitle}
          </Text>
          <TextInput
            style={[
              styles.searchInput,
              {
                borderColor: colors.border,
                backgroundColor: colors.surface,
                color: colors.text,
              },
            ]}
            placeholder="Search rooms..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            autoFocus={true}
          />
          <ScrollView style={styles.roomList}>
            {filteredRooms.length === 0 ? (
              <Text style={[styles.noResults, { color: colors.textMuted }]}>
                No rooms found
              </Text>
            ) : (
              filteredRooms.map((room) => (
                <TouchableOpacity
                  key={room}
                  style={[
                    styles.roomItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => {
                    if (selectingFor) {
                      onSelectRoom(room);
                    }
                  }}
                  disabled={!selectingFor}
                >
                  <Text style={[styles.roomText, { color: colors.text }]}>
                    {room}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  roomList: {
    maxHeight: 400,
  },
  roomItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  roomText: {
    fontSize: 16,
  },
  noResults: {
    textAlign: "center",
    padding: 20,
    fontSize: 16,
  },
  closeButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
